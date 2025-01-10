# blk_cp_mariadb_to_pg

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run src/main.ts
```

This project was created using `bun init` in bun v1.1.34. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.


### Build *`blk_cp_mariadb_to_pg`*
- Linux
```bash
    $ ~ bun build --compile --minify --sourcemap ./*.ts  --target=bun-linux-x64 --outfile=bin/blk_cp_mariadb_to_pg
```

- Windows
```bash
    $ ~ bun build --compile --minify --sourcemap ./*.ts  --target=bun-windows-x64 --outfile=bin/blk_cp_mariadb_to_pg
```

- Bun
```bash
    $ ~ bun build --minify ./*.ts --outdir=./dist --target=bun
```
