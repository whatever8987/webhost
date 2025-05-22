# Set up production environment
export DJANGO_SETTINGS_MODULE=backend.settings.production

# Database migration
python manage.py migrate --noinput

# Start Gunicorn with:
gunicorn backend.wsgi:application --bind 0.0.0.0:8000 --workers 3


docker build -t your-app .
docker run -d \
  -p 8000:8000 \
  --env-file .env.production \
  your-app