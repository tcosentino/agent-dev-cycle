# Adapter Model

- Runtime Adapter
  This is where the system runs the application components that are created.
  - Kubernetes
  - Docker
  - Serverless

- Agent Session Adapter
  This is where the system runs the different agents
  - Kubernetes
  - Docker
  - Serverless

- Agent Authentication Adapter
  This is the way claude code authenticates. Eventually we need to support other models
  - Subscription
  - API Key

- DataObject Storage Adapter
  This controls what type of database that object will be stored in
  - MongoDB
  - SQL
