#!/bin/bash
# تشخيص 404 مع Traefik - نفّذ على الـ VPS: bash check-traefik.sh

echo "=== 1) لصاقات حاوية الـ frontend ==="
docker inspect mirmaia-frontend --format '{{range $k,$v := .Config.Labels}}{{$k}}={{$v}}{{"\n"}}{{end}}' | grep traefik

echo ""
echo "=== 2) هل Traefik على شبكة web؟ ==="
docker network inspect web --format '{{range .Containers}}{{.Name}} {{end}}'

echo ""
echo "=== 3) اختبار من السيرفر (HTTP) ==="
curl -sI -H "Host: pos.mirmaia.store" http://127.0.0.1/ 2>/dev/null | head -5

echo ""
echo "=== 4) آخر سطور سجل Traefik ==="
docker logs traefik 2>&1 | tail -15
