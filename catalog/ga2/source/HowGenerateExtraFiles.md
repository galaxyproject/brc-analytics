# Instruction howto install aws client:

https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html

# Generate bucket and galaxy resources json

```bash
# From root folder
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

python3 catalog/ga2/build/py/build_extra_resources.py > catalog/ga2/source/genomeark_assembly_resources.json

```
