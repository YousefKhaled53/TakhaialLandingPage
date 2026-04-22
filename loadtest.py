"""
Takhaial Load Test & Resource Estimator
========================================
Tests the FastAPI backend (/chat, /contact) under realistic concurrent load,
measures actual RAM + CPU per request, and projects AWS sizing for 100 users.

Usage:
    python3 loadtest.py                    # uses localhost:8000 (default)
    python3 loadtest.py --url http://x.x.x.x:8000
    python3 loadtest.py --users 50 --duration 20
"""

import sys
sys.path.insert(0, "/tmp/loadtest_deps")

import argparse
import asyncio
import json
import os
import random
import statistics
import time
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from typing import List, Optional
import threading

import psutil

# ─── ANSI colours (no rich dependency required) ───────────────────────────────
RESET  = "\033[0m";  BOLD  = "\033[1m"
CYAN   = "\033[96m"; GREEN = "\033[92m"
YELLOW = "\033[93m"; RED   = "\033[91m"
MAGENTA= "\033[95m"; DIM   = "\033[2m"
WHITE  = "\033[97m"

def h(text, colour=CYAN): return f"{BOLD}{colour}{text}{RESET}"
def dim(text):            return f"{DIM}{text}{RESET}"

# ─── Data structures ──────────────────────────────────────────────────────────
@dataclass
class RequestResult:
    endpoint:       str
    status:         int
    latency_ms:     float
    success:        bool
    error:          Optional[str] = None

@dataclass
class MemSnapshot:
    timestamp:  float
    rss_mb:     float   # resident set size of the backend process
    cpu_pct:    float

@dataclass
class LoadReport:
    results:        List[RequestResult] = field(default_factory=list)
    mem_snapshots:  List[MemSnapshot]   = field(default_factory=list)
    start_time:     float = 0.0
    end_time:       float = 0.0
    backend_pid:    Optional[int] = None

# ─── Helpers ─────────────────────────────────────────────────────────────────
def find_backend_pid(port: int = 8000) -> Optional[int]:
    """Find the PID of the process listening on the backend port."""
    try:
        for conn in psutil.net_connections(kind="tcp"):
            if conn.laddr.port == port and conn.status == "LISTEN":
                return conn.pid
    except (psutil.AccessDenied, PermissionError):
        # macOS sandbox / SIP may block net_connections; fall back to scanning processes
        try:
            for proc in psutil.process_iter(["pid", "name", "cmdline"]):
                try:
                    info = proc.info
                    cmdline = " ".join(info.get("cmdline") or [])
                    if str(port) in cmdline and ("uvicorn" in cmdline or "python" in cmdline):
                        return info["pid"]
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
        except Exception:
            pass
    return None

def http_post(url: str, payload: dict, timeout: float = 15.0) -> tuple[int, float, Optional[str]]:
    """Synchronous HTTP POST — returns (status_code, latency_ms, error_or_None)."""
    data = json.dumps(payload).encode()
    req  = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    t0 = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            resp.read()
            return resp.status, (time.perf_counter() - t0) * 1000, None
    except urllib.error.HTTPError as e:
        return e.code, (time.perf_counter() - t0) * 1000, str(e)
    except Exception as e:
        return 0, (time.perf_counter() - t0) * 1000, str(e)

def http_get(url: str, timeout: float = 10.0) -> tuple[int, float, Optional[str]]:
    t0 = time.perf_counter()
    try:
        with urllib.request.urlopen(url, timeout=timeout) as resp:
            resp.read()
            return resp.status, (time.perf_counter() - t0) * 1000, None
    except Exception as e:
        return 0, (time.perf_counter() - t0) * 1000, str(e)

# ─── Request workers ──────────────────────────────────────────────────────────
CHAT_MESSAGES = [
    "Tell me about Closr",
    "What is spatial computing?",
    "How does Lucid VR work?",
    "What products does Takhaial offer?",
    "Can you deploy an agent for retail?",
    "Tell me about Metis education AI",
    "How does Eikon celebrity AI work?",
    "What is Nexus mixed reality?",
]

CONTACT_NAMES    = ["Sara Al-Rashid", "James Chen", "Ahmed Hasan", "Priya Nair", "Carlos Rivera"]
CONTACT_EMAILS   = ["sara@acme.com", "james@techco.io", "ahmed@startup.ae", "priya@corp.in", "carlos@agency.mx"]
CONTACT_COMPANIES = ["ACME Corp", "TechCo", "Gulf Startup", "Corp India", "Agency MX"]

def make_user_session(base_url: str, user_id: int) -> List[RequestResult]:
    """
    Simulate one user's session:
      1. GET /health            (page load / health check)
      2. POST /chat             (user interacts with AI agent)
      3. POST /contact  (30%)   (some users fill the contact form)
    """
    results = []
    think_time = lambda: time.sleep(random.uniform(0.2, 1.2))

    # 1. Health / root check
    status, lat, err = http_get(f"{base_url}/health")
    results.append(RequestResult("/health", status, lat, status == 200, err))
    think_time()

    # 2. Chat message (every user sends 1-3 messages)
    for _ in range(random.randint(1, 3)):
        msg = random.choice(CHAT_MESSAGES)
        status, lat, err = http_post(
            f"{base_url}/chat",
            {"message": msg, "session_id": f"user-{user_id}"},
        )
        results.append(RequestResult("/chat", status, lat, status == 200, err))
        think_time()

    # 3. Contact form — 30 % of users
    if random.random() < 0.30:
        i = user_id % len(CONTACT_NAMES)
        status, lat, err = http_post(
            f"{base_url}/contact",
            {
                "name":    CONTACT_NAMES[i],
                "email":   CONTACT_EMAILS[i],
                "company": CONTACT_COMPANIES[i],
                "message": "I want to learn more about your spatial computing solutions.",
            },
        )
        results.append(RequestResult("/contact", status, lat, status in (200, 201), err))

    return results

# ─── Memory monitor ───────────────────────────────────────────────────────────
def monitor_memory(proc: psutil.Process, snapshots: List[MemSnapshot], stop_event: threading.Event):
    """Runs in a background thread, sampling RAM + CPU every 0.5 s."""
    while not stop_event.is_set():
        try:
            mem = proc.memory_info().rss / 1024 / 1024
            cpu = proc.cpu_percent(interval=None)
            snapshots.append(MemSnapshot(time.time(), mem, cpu))
        except psutil.NoSuchProcess:
            break
        time.sleep(0.5)

# ─── Main load test ───────────────────────────────────────────────────────────
def run_load_test(base_url: str, concurrent_users: int, duration_s: int) -> LoadReport:
    report = LoadReport()

    # Locate backend process for live memory tracking
    port = int(base_url.split(":")[-1].rstrip("/"))
    pid  = find_backend_pid(port)
    report.backend_pid = pid

    proc = None
    stop_event = threading.Event()
    monitor_thread = None

    if pid:
        try:
            proc = psutil.Process(pid)
            proc.cpu_percent(interval=None)  # prime the counter
            monitor_thread = threading.Thread(
                target=monitor_memory,
                args=(proc, report.mem_snapshots, stop_event),
                daemon=True,
            )
            monitor_thread.start()
        except psutil.NoSuchProcess:
            proc = None

    print(f"\n{h('  PHASE 1 — Warm-up', MAGENTA)}  (single user, 3 requests)\n")
    warmup = make_user_session(base_url, user_id=0)
    for r in warmup:
        status_col = GREEN if r.success else RED
        print(f"  {dim(r.endpoint):30s}  {h(r.status, status_col)}  {r.latency_ms:7.1f} ms")

    print(f"\n{h('  PHASE 2 — Ramp-up', MAGENTA)}  ({concurrent_users} concurrent users, ~{duration_s}s window)\n")

    report.start_time = time.time()

    # Stagger user arrivals across the first 5 seconds to simulate realistic ramp
    arrival_spread = min(5.0, duration_s * 0.4)

    def run_user(uid: int) -> List[RequestResult]:
        time.sleep(random.uniform(0, arrival_spread))
        return make_user_session(base_url, user_id=uid)

    lock = threading.Lock()
    completed = [0]

    def run_user_tracked(uid: int) -> List[RequestResult]:
        res = run_user(uid)
        with lock:
            completed[0] += 1
            done = completed[0]
            bar_len = 30
            filled = int(bar_len * done / concurrent_users)
            bar = "█" * filled + "░" * (bar_len - filled)
            pct = int(100 * done / concurrent_users)
            print(f"  \r  [{bar}] {pct:3d}%  {done}/{concurrent_users} users done", end="", flush=True)
        return res

    with ThreadPoolExecutor(max_workers=concurrent_users) as pool:
        futures = [pool.submit(run_user_tracked, uid) for uid in range(1, concurrent_users + 1)]
        for f in futures:
            report.results.extend(f.result())

    print()  # newline after progress bar
    report.end_time = time.time()

    stop_event.set()
    if monitor_thread:
        monitor_thread.join(timeout=2)

    return report

# ─── Analysis & reporting ─────────────────────────────────────────────────────
def analyse(report: LoadReport, concurrent_users: int, base_url: str):
    total_duration = report.end_time - report.start_time
    all_results    = report.results
    total_requests = len(all_results)
    successes      = [r for r in all_results if r.success]
    failures       = [r for r in all_results if not r.success]

    by_endpoint: dict[str, List[RequestResult]] = {}
    for r in all_results:
        by_endpoint.setdefault(r.endpoint, []).append(r)

    snaps = report.mem_snapshots

    print(f"\n{'═'*65}")
    print(h("  TAKHAIAL LOAD TEST — RESULTS", WHITE))
    print(f"{'═'*65}\n")

    # ── Overview ──────────────────────────────────────────────────────────────
    print(h("  OVERVIEW", CYAN))
    print(f"  Target URL        {dim(base_url)}")
    print(f"  Concurrent users  {h(concurrent_users, YELLOW)}")
    print(f"  Total requests    {h(total_requests, YELLOW)}")
    print(f"  Succeeded         {h(len(successes), GREEN)}")
    print(f"  Failed            {h(len(failures), RED if failures else GREEN)}")
    success_rate = 100 * len(successes) / total_requests if total_requests else 0
    print(f"  Success rate      {h(f'{success_rate:.1f}%', GREEN if success_rate >= 99 else YELLOW)}")
    print(f"  Wall-clock time   {dim(f'{total_duration:.1f} s')}")
    if total_duration > 0:
        rps = total_requests / total_duration
        print(f"  Throughput        {h(f'{rps:.1f} req/s', CYAN)}")

    # ── Per-endpoint latency ──────────────────────────────────────────────────
    print(f"\n{h('  LATENCY BY ENDPOINT', CYAN)}\n")
    print(f"  {'Endpoint':<18} {'Count':>6} {'Median':>10} {'p95':>10} {'p99':>10} {'Max':>10}  {'OK%':>6}")
    print(f"  {'─'*18} {'─'*6} {'─'*10} {'─'*10} {'─'*10} {'─'*10}  {'─'*6}")

    for ep, rlist in sorted(by_endpoint.items()):
        lats     = sorted(r.latency_ms for r in rlist)
        ok_count = sum(1 for r in rlist if r.success)
        ok_pct   = 100 * ok_count / len(rlist)
        median   = statistics.median(lats)
        p95      = lats[int(len(lats) * 0.95)] if lats else 0
        p99      = lats[int(len(lats) * 0.99)] if lats else 0
        maxlat   = max(lats) if lats else 0
        col      = GREEN if ok_pct >= 99 else YELLOW
        print(
            f"  {ep:<18} {len(rlist):>6} "
            f"{h(f'{median:,.0f} ms', col):>20} "
            f"{p95:>8,.0f} ms "
            f"{p99:>8,.0f} ms "
            f"{maxlat:>8,.0f} ms  "
            f"{ok_pct:>5.1f}%"
        )

    # ── Memory & CPU ─────────────────────────────────────────────────────────
    print(f"\n{h('  BACKEND RESOURCE USAGE (live measurements)', CYAN)}\n")
    if snaps:
        mem_vals = [s.rss_mb for s in snaps]
        cpu_vals = [s.cpu_pct for s in snaps]
        baseline_mem = mem_vals[0]   if mem_vals else 0
        peak_mem     = max(mem_vals) if mem_vals else 0
        avg_mem      = statistics.mean(mem_vals) if mem_vals else 0
        peak_cpu     = max(cpu_vals) if cpu_vals else 0
        avg_cpu      = statistics.mean(cpu_vals) if cpu_vals else 0

        print(f"  Baseline RAM (idle)   {h(f'{baseline_mem:.1f} MB', YELLOW)}")
        print(f"  Peak RAM (under load) {h(f'{peak_mem:.1f} MB', RED if peak_mem > 400 else YELLOW)}")
        print(f"  Avg RAM (under load)  {h(f'{avg_mem:.1f} MB', YELLOW)}")
        print(f"  Peak CPU              {h(f'{peak_cpu:.1f}%', RED if peak_cpu > 80 else YELLOW)}")
        print(f"  Avg CPU               {h(f'{avg_cpu:.1f}%', YELLOW)}")

        mem_delta = peak_mem - baseline_mem
        print(f"  RAM delta (load vs idle) {h(f'+{mem_delta:.1f} MB', MAGENTA)}")
        per_user_ram = mem_delta / concurrent_users if concurrent_users else 0
        print(f"  Estimated RAM per user   {h(f'~{per_user_ram:.2f} MB', MAGENTA)}")
    else:
        baseline_mem = 90.0
        peak_mem     = 130.0
        per_user_ram = 0.4
        avg_cpu      = 15.0
        peak_cpu     = 40.0
        print(f"  {dim('(Backend PID not detected — using baseline estimates)')}")
        print(f"  Estimated idle RAM       {h('~80–100 MB', YELLOW)}  {dim('(FastAPI + Uvicorn baseline)')}")
        print(f"  Per-request overhead     {h('~0.3–0.5 MB', YELLOW)}  {dim('(pure Python async, no model)')}")
        print(f"  Typical CPU per request  {h('~1–3%', YELLOW)}  {dim('(on a single t3.micro vCPU)')}")

    # ── Errors detail ─────────────────────────────────────────────────────────
    if failures:
        print(f"\n{h('  ERRORS (sample)', RED)}\n")
        seen = set()
        for r in failures[:8]:
            key = f"{r.endpoint}:{r.error}"
            if key not in seen:
                seen.add(key)
                print(f"  {dim(r.endpoint):25s}  {h(r.status, RED)}  {r.error}")

    # ── AWS Sizing projection ─────────────────────────────────────────────────
    print(f"\n{'═'*65}")
    print(h("  AWS SIZING PROJECTION", WHITE))
    print(f"{'═'*65}\n")

    # Use measured or estimated numbers
    if snaps:
        idle_ram_mb     = mem_vals[0]
        per_user_ram_mb = max(0.1, (max(mem_vals) - mem_vals[0]) / concurrent_users)
    else:
        idle_ram_mb     = 90.0
        per_user_ram_mb = 0.4

    for n_users in [10, 50, 100, 500, 1000]:
        proj_ram = idle_ram_mb + (per_user_ram_mb * n_users)
        # Add OS + Next.js SSR overhead (if co-hosted): ~300 MB
        proj_ram_total = proj_ram + 350

        if proj_ram_total < 400:
            instance = "t3.micro    ($8.50/mo)"   ; ram_needed = "1 GB"
        elif proj_ram_total < 900:
            instance = "t3.small    ($17/mo)"     ; ram_needed = "2 GB"
        elif proj_ram_total < 1800:
            instance = "t3.medium   ($34/mo)"     ; ram_needed = "4 GB"
        elif proj_ram_total < 3600:
            instance = "t3.large    ($67/mo)"     ; ram_needed = "8 GB"
        else:
            instance = "t3.xlarge   ($134/mo)"    ; ram_needed = "16 GB"

        bar_len = 20
        filled  = min(bar_len, int(bar_len * proj_ram_total / 4096))
        bar     = "█" * filled + "░" * (bar_len - filled)
        col     = GREEN if filled < 8 else (YELLOW if filled < 14 else RED)
        print(
            f"  {h(f'{n_users:>5} users', CYAN)}  "
            f"[{h(bar, col)}]  "
            f"{proj_ram_total:>6.0f} MB RAM  →  {h(instance, YELLOW)}  ({ram_needed})"
        )

    print(f"\n  {h('Notes:', WHITE)}")
    print(f"  {dim('• Projections include: FastAPI backend + OS + Next.js SSR (~350 MB baseline)')}")
    print(f"  {dim('• /chat holds a 1-second asyncio.sleep — it scales fine (non-blocking I/O)')}")
    print(f"  {dim('• Replace asyncio.sleep with a real LLM call → latency ×5–15×, RAM unchanged')}")
    print(f"  {dim('• Use Vercel for Next.js (free) and only host FastAPI on EC2 → halve the RAM')}")
    print(f"  {dim('• Add a real database (Postgres) → +100–200 MB baseline on the same box')}")
    print(f"  {dim('• Storage: 20 GB gp3 EBS is sufficient for the current codebase + logs')}")

    # ── Recommendation ────────────────────────────────────────────────────────
    print(f"\n{h('  RECOMMENDATION FOR 100 CONCURRENT USERS', GREEN)}\n")
    proj_100 = idle_ram_mb + (per_user_ram_mb * 100) + 350
    if proj_100 < 900:
        rec_instance = "t3.small (2 GB RAM, 2 vCPU)"
        rec_cost     = "~$17/month"
    elif proj_100 < 1800:
        rec_instance = "t3.medium (4 GB RAM, 2 vCPU)"
        rec_cost     = "~$34/month"
    else:
        rec_instance = "t3.large (8 GB RAM, 2 vCPU)"
        rec_cost     = "~$67/month"

    print(f"  Instance   {h(rec_instance, GREEN)}")
    print(f"  Storage    {h('20 GB gp3 EBS', GREEN)}  (~$1.60/mo)")
    print(f"  Cost       {h(rec_cost, GREEN)}  (on-demand, us-east-1)")
    print(f"  Alt        {dim('Vercel (free) + t3.micro for FastAPI only → ~$8.50/mo')}")
    print(f"\n{'═'*65}\n")

# ─── Entry point ──────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Takhaial Load Test")
    parser.add_argument("--url",      default="http://localhost:8000", help="Backend base URL")
    parser.add_argument("--users",    type=int, default=20,            help="Concurrent users to simulate")
    parser.add_argument("--duration", type=int, default=30,            help="Approximate test window (seconds)")
    args = parser.parse_args()

    print(f"\n{'═'*65}")
    print(h("  TAKHAIAL · LOAD TEST & RESOURCE ESTIMATOR", CYAN))
    print(f"{'═'*65}")
    print(f"  Target   {dim(args.url)}")
    print(f"  Users    {h(args.users, YELLOW)}")
    print(f"  Window   {dim(f'~{args.duration}s')}")
    print(f"{'═'*65}")

    # Connectivity check
    print(f"\n  {dim('Checking backend connectivity…')}")
    status, lat, err = http_get(f"{args.url}/health")
    if status != 200:
        print(f"\n  {h('✗ Backend unreachable', RED)}: {err}")
        print(f"  {dim('Start it with: uvicorn main:app --reload --port 8000')}\n")
        sys.exit(1)
    print(f"  {h('✓ Backend online', GREEN)}  {dim(f'({lat:.0f} ms)')}\n")

    report = run_load_test(args.url, args.users, args.duration)
    analyse(report, args.users, args.url)

if __name__ == "__main__":
    main()
