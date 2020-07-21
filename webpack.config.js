/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path")

module.exports = {
    entry: "./src/index.ts",
    mode: "production",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            }
        ],
    },
    target: "node",
    resolve: {
        extensions: [ ".tsx", ".ts", ".js", ".json"]
    },
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, "dist"),
    }
}
