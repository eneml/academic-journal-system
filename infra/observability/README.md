# Observability

The backend exposes Micrometer metrics on `GET /actuator/prometheus`. Wire
your Prometheus scraper at that endpoint, then mount the assets here for
dashboards and alerts.

## Files

| Path | Purpose |
|------|---------|
| `grafana/ajs-overview.json` | Importable Grafana dashboard with JVM, HTTP, DB pool, and deposit-outbox panels. |
| `prometheus/alerts.yml` | Prometheus alerting rules (availability, error rate, resource pressure). |

## Quick set up

### Prometheus scrape config

```yaml
scrape_configs:
  - job_name: ajs-backend
    metrics_path: /actuator/prometheus
    static_configs:
      - targets: ["backend:8080"]
```

### Grafana

Import `grafana/ajs-overview.json` via the dashboards UI. When prompted,
pick your Prometheus data source for the `${DS_PROMETHEUS}` variable.

### Alerts

Reference `prometheus/alerts.yml` from your main Prometheus config:

```yaml
rule_files:
  - /etc/prometheus/rules/ajs-alerts.yml
```

## Custom metrics emitted by the backend

| Metric | Source | Notes |
|--------|--------|-------|
| `http_server_requests_seconds_*` | Spring Boot | Default Micrometer HTTP timer. |
| `hikaricp_connections_*` | Hikari + Micrometer | Connection pool sat / idle / pending. |
| `jvm_*` | Micrometer JVM bindings | Heap, threads, GC. |
| `deposit_record_pending_count` | (planned) integration module | Outbox depth gauge — wire via `MeterRegistry` if you want the alert. |

The `deposit_record_pending_count` alert is a soft alert — the
underlying gauge needs to be registered before it fires. Until then it
silently passes (`absent()` would catch it but adds noise during cold
starts; left as a follow-up).
