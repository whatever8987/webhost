from drf_yasg import openapi
from drf_yasg.generators import OpenAPISchemaGenerator
from drf_yasg.views import get_schema_view

class CustomOpenAPISchemaGenerator(OpenAPISchemaGenerator):
    def get_operation_id(self, operation_keys):
        # Convert camelCase to snake_case and join with underscores
        operation_id = '_'.join(operation_keys).lower()
        return operation_id

schema_view = get_schema_view(
    openapi.Info(
        title="Business API",
        default_version='v1',
        description="API for managing businesses and their types",
        terms_of_service="https://www.example.com/terms/",
        contact=openapi.Contact(email="contact@example.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    generator_class=CustomOpenAPISchemaGenerator,
)