Locust load testing

Install Locust and run a basic simulation against your staging server.

Install:
```
python -m pip install locust
```

Run (from project root):
```
LOCUST_HOST=http://127.0.0.1:8000 locust -f load/locustfile.py
```

Open http://localhost:8089 and start the test.
