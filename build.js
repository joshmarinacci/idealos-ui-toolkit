import { build } from "esbuild";
// import pkg from "npm-dts";
// const { Generator } = pkg;

async function go() {
    // const sharedConfig = {
    //     entryPoints: ["src/index.ts"],
    //     bundle: true,
    //     minify: true,
    // };

    // await new Generator({
    //     entry: "src/index.ts",
    //     output: "build/index.d.ts",
    // }).generate();
    //
    // await build({
    //     ...sharedConfig,
    //     platform: "node",
    //     outfile: "build/index.cjs",
    // });
    //
    await build({
        // ...sharedConfig,
        entryPoints: ['src/index.ts'],
        bundle: true,
        platform: "browser",
        format: "esm",
        outfile: "build/bundle.js",
        target:['es2020']
        // external: ["pngjs", "opentype.js", "jpeg-js"],
    });
}

go()
    .then(() => console.log("done"))
    .catch((e) => console.log(e));
