# Instruction howto install aws client:
# https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
#

aws s3api list-objects-v2   --endpoint-url https://js2.jetstream-cloud.org:8001   --no-sign-request   --bucket genomeark   --prefix alignment   --query "Contents[?contains(Key, '.2bit') || contains(Key, '.fa.gz')].Key"   --output json 2>&1 | sed -n '/^\[/{:a;p;n;ba}' | python3 -c "import sys, json, re;
paths=json.load(sys.stdin);
out={};
for p in paths:
    m=re.search(r'(G[CA]F?_\d+\.\d+)', p);
    if not m: continue;
    key=m.group(1);
    ext=p.split(key+'.')[-1].replace('.gz','');
    out.setdefault(key,{})[ext]=p;
json.dump(out, sys.stdout, indent=2)" > AssemblyGenomeArkBucketFile.json
