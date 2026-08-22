# ADR-001: Technology Stack Selection

## Status
Accepted   <!-- Proposed | Accepted | Superseded -->

## Context
The application required an architecture that could support containerized workloads, reliable deployments, relational data, and production observability before implementation began. These decisions needed to be made upfront because they directly influence how the application is built, deployed, monitored, and operated.

## Decision
- Frontend: React
- API: Node.js
- Database: PostgreSQL
- Container runtime: Docker
- Orchestration: Kubernetes (EKS)
- Deployment: ArgoCD (GitOps)
- CI/CD: GitHub Actions
- Observability: Prometheus + Grafana, ELK

## Alternatives Considered

### Frontend: React
I considered Vue as an alternative, but chose React because its large
ecosystem and broad developer familiarity make it easier for a small team
to find resources, libraries, and support. Its flexibility also fits the
project without imposing unnecessary framework conventions.

### API: Node.js
I considered Python/FastAPI as an alternative, but chose Node.js so the
frontend and backend can use the same JavaScript/TypeScript ecosystem. This
reduces context switching for a small team and makes it easier for
developers to contribute across the full stack.

### Database: PostgreSQL
I considered DynamoDB as an alternative because of its scalability and low
operational overhead, but rejected it because the application data has
relationships that require joins, foreign keys, and transactional
consistency. PostgreSQL is better suited for querying related data, such as
users, bookings, and payments, without pushing complex joins into
application code. The relational model also gives me stronger data
integrity guarantees as the application grows.

### Container runtime: Docker
I considered running the application directly on EC2 with manually
installed dependencies, but rejected it because EKS requires containerized
workloads. Docker provides a consistent, portable application image that
can run across development, testing, and production environments. This
also reduces environment drift and makes deployments more predictable and
repeatable.

### Orchestration: Kubernetes (EKS)
I chose Amazon EKS over ECS/Fargate because, while ECS/Fargate is simpler, EKS provides greater flexibility and fine-grained control over scheduling, networking, and deployment strategies. EKS also supports Kubernetes-native tools like ArgoCD and Prometheus, which are valuable for advanced deployment and monitoring practices such as canary releases. Since Kubernetes is an industry standard, it also provides better portability and makes it easier for an on-call team to work with familiar tooling. Although EKS has more operational overhead, I considered the additional control, flexibility, and long-term scalability worth the trade-off.

### Deployment: ArgoCD (GitOps)
I considered using GitHub Actions to run `kubectl apply` or `helm upgrade`
directly against the cluster, but rejected this push-based approach because
it gives CI direct write access to production. ArgoCD uses a pull-based
GitOps model, where CI updates the desired state in Git and ArgoCD
synchronizes it from inside the cluster, reducing the blast radius of a
compromised CI pipeline. It also provides an auditable source of truth for
deployments and makes rollbacks to previous versions simpler and more
reliable.

### CI/CD: GitHub Actions
I considered Jenkins as an alternative, but chose GitHub Actions because the
application code and deployment manifests are already hosted in GitHub,
providing native integration with the repository. It also reduces
operational overhead by eliminating the need to provision and maintain a
separate CI server. With the ArgoCD GitOps model, GitHub Actions has a
focused responsibility: build and test the application, push the image to
the registry, and update the Git manifest without requiring direct access
to the Kubernetes cluster.

### Monitoring: Prometheus + Grafana
I considered AWS CloudWatch as the managed alternative, but chose Prometheus
and Grafana because they integrate naturally with Kubernetes and provide
greater flexibility over metrics collection, dashboards, and alerting. For
this project, the additional operational overhead was acceptable in
exchange for using open-source, Kubernetes-native tooling and avoiding
dependence on a managed monitoring platform.

### Logging: ELK
I considered AWS CloudWatch Logs as the alternative, but chose ELK to
provide centralized, searchable logs with greater control over log
processing, retention, and analysis. This is particularly useful in
Kubernetes, where pods are ephemeral and logs can disappear when workloads
are rescheduled, making centralized logging important for troubleshooting
production issues.

## Consequences
This stack commits the team to Kubernetes literacy and the operational overhead of managing EKS. It also results in higher infrastructure and operational costs than a simpler serverless approach, while self-managed Prometheus, Grafana, and ELK require ownership of upgrades, storage, configuration, and troubleshooting. The GitOps model also requires the team to maintain deployment manifests and the ArgoCD workflow.

## Open Questions
The following decisions are intentionally deferred:

- Do we need a service mesh such as Istio or Linkerd? This can be evaluated when traffic patterns and service-to-service complexity justify it.
- What level of automated scaling and resource tuning will be required as production traffic grows?
- Should observability eventually move to a fully managed platform if the operational overhead of the self-managed stack becomes too high?