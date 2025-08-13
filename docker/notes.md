# Run

move dist folder of /frontend here

./build-docker.sh



```
docker tag datakit/app:latest datakitpage/datakit:latest
```

(IMPORTANT: Need to tag this first (the way we want but here just latest))

```
docker push datakitpage/datakit
```

with a specific tag

(PS: tagname should be incremental so you got to check the docker hub first)
```
docker push datakitpage/datakit:tagname
```

DO MULTI TAG: 

docker buildx build --platform linux/amd64,linux/arm64 -t datakitpage/datakit:latest --push .