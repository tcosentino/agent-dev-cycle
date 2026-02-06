# @agentforge/runtime

Deployment and runtime management for AgentForge apps.

## Concepts

### Module
A "module" is a deployable unit of an app - could be an API resource, a background job, a UI component, etc. Each module type has its own deployment and testing requirements.

### Deployment Pipeline
Standard stages that all deployments go through:

1. **validate** - Check that the module definition is valid
2. **build** - Build any artifacts (Docker images, bundles, etc.)
3. **deploy** - Deploy to the target environment
4. **healthcheck** - Verify the deployment is running
5. **test** - Run module-specific tests to verify functionality
6. **complete** - Mark deployment as successful (or rollback on failure)

### Module Types
- `api-resource` - REST API resource (CRUD endpoints)
- `background-job` - Scheduled or triggered background tasks
- `ui-page` - Frontend page/component
- (more to come)

Each module type defines:
- What artifacts to build
- How to deploy
- What tests to run post-deploy
