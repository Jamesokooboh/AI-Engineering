# ADR-001: Technology Stack Selection

## Status
Accepted   <!-- Proposed | Accepted | Superseded -->

## Context
This project is an AI mentorship platform where users book and pay for
1-on-1 sessions with mentors, and the platform manages mentor availability
and scheduling. The application required an architecture that could support
containerized workloads, reliable deployments, relational data with real
transactional integrity (bookings, payments), and production observability
before implementation began, since it handles paying customers and is
expected to run with a team on call. These decisions needed to be made
upfront because they directly influence how the application is built,
deployed, monitored, and operated.

## Decision
- Cloud provider: AWS
- Language: TypeScript
- Frontend: React
- Frontend framework: Next.js
- Backend framework: Express
- API: Node.js
- Database: PostgreSQL
- Database access: Prisma
- Container runtime: Docker
- Image registry: Amazon ECR
- Orchestration: Kubernetes (EKS)
- Deployment: ArgoCD (GitOps)
- CI/CD: GitHub Actions
- Observability: Prometheus + Grafana, ELK
- Log collector: Fluent Bit

## Alternatives Considered

### Cloud Provider: AWS
I considered GCP and Azure as alternatives, but chose AWS primarily because
of existing team experience with the platform, which reduces onboarding
time and the risk of operational mistakes. AWS also has the most mature
managed Kubernetes offering (EKS) and the broadest ecosystem of tools this
stack already depends on.

### Language: TypeScript
I considered plain JavaScript, but chose TypeScript because compile-time
type checking catches a class of bugs before they reach production, which
matters for a system handling payments with a team on call. TypeScript
types can also be shared between the Next.js frontend and Express API,
reducing contract mismatches across the stack.

### Frontend: React
I considered Vue as an alternative, but chose React because its large
ecosystem and broad developer familiarity make it easier for a small team
to find resources, libraries, and support. Its flexibility also fits the
project without imposing unnecessary framework conventions.

### Frontend: Next.js

I considered React with a separate frontend setup as an alternative, but chose Next.js because it provides a production-ready framework around React with built-in routing, server-side rendering, and optimization features. It also allows the frontend architecture to remain flexible as the application grows without introducing multiple frameworks or additional configuration.

### Backend: Express

I considered more opinionated frameworks such as NestJS or Python/FastAPI, but chose Express because the API requirements are relatively straightforward and do not require a heavily opinionated framework. Its lightweight design gives the team more control over the API structure while benefiting from the mature Node.js ecosystem and the same JavaScript/TypeScript stack used by the frontend.

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

### Database Access: Prisma
I considered using the raw `pg` driver as an alternative, but chose Prisma
because the project already uses TypeScript and Prisma provides type-safe
database access generated directly from the schema. This reduces the need
to manually define database types and write repetitive SQL queries, which
helps a small team develop faster while reducing common query and
type-mismatch errors. The ORM also provides a consistent way to manage
database operations and migrations as the application grows.

### Container runtime: Docker
I considered running the application directly on EC2 with manually
installed dependencies, but rejected it because EKS requires containerized
workloads. Docker provides a consistent, portable application image that
can run across development, testing, and production environments. This
also reduces environment drift and makes deployments more predictable and
repeatable.

### Image Registry: Amazon ECR
I considered Docker Hub as an alternative, but chose Amazon ECR because the workloads are running on AWS EKS and ECR integrates directly with AWS IAM and the AWS ecosystem. Keeping container images within AWS simplifies authentication and access control while avoiding unnecessary external registry dependencies for production workloads.

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
greater flexibility over metrics collection, dashboards, and alerting.
PromQL's query model and native Kubernetes service discovery fit this
architecture more directly than CloudWatch's metric model.

### Logging: ELK
I considered AWS CloudWatch Logs as the alternative, but chose ELK to
provide centralized, searchable logs with greater control over log
processing, retention, and analysis. This is particularly useful in
Kubernetes, where pods are ephemeral and logs can disappear when workloads
are rescheduled, making centralized logging important for troubleshooting
production issues.

### Log Collector: Fluent Bit

I considered Logstash as an alternative, but chose Fluent Bit because it is lightweight and well suited to Kubernetes environments where it can run as a DaemonSet and collect logs from nodes or containers. Its lower resource footprint makes it more appropriate for collecting and forwarding logs to the ELK stack without adding significant overhead to the application workloads.

## Consequences
This stack commits the team to Kubernetes literacy and the operational overhead of managing EKS. It also results in higher infrastructure and operational costs than a simpler serverless approach, while self-managed Prometheus, Grafana, and ELK require ownership of upgrades, storage, configuration, and troubleshooting. The GitOps model also requires the team to maintain deployment manifests and the ArgoCD workflow.

## Open Questions
The following decisions are intentionally deferred:

- Do we need a service mesh such as Istio or Linkerd? This can be evaluated when traffic patterns and service-to-service complexity justify it.
- What level of automated scaling and resource tuning will be required as production traffic grows?
- Should observability eventually move to a fully managed platform if the operational overhead of the self-managed stack becomes too high?