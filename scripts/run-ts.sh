if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <filename>" >&2
  exit 1
fi

npx esbuild "$1" --bundle --platform=node | node
