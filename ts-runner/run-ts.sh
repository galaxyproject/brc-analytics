OUT_PATH=ts-runner/out/"$2".js
npx esbuild $1 --bundle --outfile="$OUT_PATH" --platform=node
node "$OUT_PATH"
