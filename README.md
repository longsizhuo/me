# Resume
This is a simple resume website built with Vite.js.
Trying rebuild it to Next.js.

# Running it locally
```shell
npm install
npm run dev
```

# Building it
```shell
npm run build
```

# Running the built version
```shell
npm run serve
```

# Linting
```shell
npm run lint
```

# Deploying it to a server
```shell
npm run build
cd ./dist
sudo rsync -av --delete . /var/www/my-frontend/
sudo nginx -s reload
```
