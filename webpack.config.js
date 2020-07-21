/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path")
const nodeExternals = require("webpack-node-externals")

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
    externals: [
        // nodeExternals()
    ],
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, "dist"),
    }
}
