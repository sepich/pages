---
title: How to write a GitHub Action in Python for changed files 
date: 2025-03-16T20:03:01+01:00
tags:
  - GitHub
  - Python
toc: true
---
Let's write a simple Python in-place GitHub Action to return which group of files has changed.
## Why?
I like the ideology behind monorepos. But apart from all the good stuff they bring, you also need some support from CI/CD side to make them working. At least you want to only trigger the subset of builds based on a which subset of files has changed. And that should be the basic functionality of CI.
```yaml
on:
  push:
    paths:
      - "/components/component-A/**"
```
And GitHub can do a [on.path](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions#onpushpull_requestpull_request_targetpathspaths-ignore) scoping at workflow level (shown above). But what if you already not at `hello-world` level? And have a folder with 100 components subfolders, which you want to test and deploy separately (but in generally same way). That means you would need to also create at least 100 files in your `.github/workflows/` folder (and that is just for `test`, and then another 100 files for `deploy`).

There is a better way - to create these 100 builds in run-time from a single workflow. You start your first `job`, which checks changed files and generates following `jobs` via [matrix](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions#jobsjob_idstrategymatrix) strategy. (But remember, matrix has a limit of 256 new jobs)

Unfortunately that is not something existing as a built-in Action from GitHub. But you can say "there is a huge [Action Marketplace](https://github.com/marketplace?type=actions), you can find everything there". Yes, such action does exist already:

[https://www.stepsecurity.io/blog/harden-runner-detection-tj-actions-changed-files-action-is-compromised](https://www.stepsecurity.io/blog/harden-runner-detection-tj-actions-changed-files-action-is-compromised)
> Popular GitHub Action `tj-actions/changed-files` has been compromised with a payload that appears to attempt to dump secrets    
> All versions of `tj-actions/changed-files` are compromised

But I do not want to review the 30k files in the `node_modules/` of an Action looking for another [left-pad](https://en.wikipedia.org/wiki/Npm_left-pad_incident). So, let's just use Python?
## Building blocks

### Python

[GitHub runner](https://github.com/actions/runner/blob/main/images/Dockerfile) is a `.NET Core` app executing scripts in `Typescript`. Also as I see, the only available SDK is in Typescript too, which you can use via official [actions/github-script](https://github.com/actions/github-script)

But can we use **Python** here? Let's check, at least at time of this writing here is the output on public GitHub runners:
```bash  
python --version
# Python 3.12.3  

pip list  
# 83 packages including:  
# requests           2.31.0  
# PyYAML             6.0.1 
```  

### Minimal in-repo Action
Now we need some simple way to create our new custom Action without building docker images or creating new git repositories. And per [docs](https://docs.github.com/en/actions/sharing-automations/creating-actions/creating-a-composite-action#creating-a-composite-action-within-the-same-repository) it is possible via placing it to `.github/actions/` folder. Let's try if it works, create new branch with 2 files below:

```yaml
# .github/actions/changed-files/action.yml
name: Changed Files
description: Check which files have changed
inputs:
  groups_yaml:  # id of input
    description: "map[string-group-id][]string-file-glob in YAML format"
    required: false
    default: ''
  groups_yaml_file:
    description: "Path to a YAML file with content of `groups_yaml`"
    required: false
    default: ""
outputs: # max 50mb
  groups: # id of output, max 1mb
    description: "List of group-id having changed files"
    value: ${{ steps.check.outputs.groups }}
    
runs:
  using: composite
  steps:
    - name: check changed files
      id: check
      env:
        GITHUB_TOKEN: ${{ github.token }}
        INPUT_GROUPS_YAML: ${{ inputs.groups_yaml }}
        INPUT_GROUPS_YAML_FILE: ${{ inputs.groups_yaml_file }}
    shell: sh
    run: |
      env
      echo 'groups=["a", "b"]' >> $GITHUB_OUTPUT
```
And then call it:
```yaml
# .github/workflows/test.yml
name: test
on:  
  pull_request:  
    branches: ["*"]
jobs:  
  prepare:  
    runs-on: ubuntu-latest  
    steps:  
      - uses: actions/checkout@v4 # as our action is in repo, we need get it first
      - id: changed  
        uses: ./.github/actions/changed-files  
        with:  
          groups_yaml: "test-input"
    outputs:
      matrix: ${{ steps.changed.outputs.groups }}
  
  work:
    runs-on: ubuntu-latest
    needs: prepare
    steps:
      - run: echo "${{needs.prepare.outputs.matrix}}"
```
Now you can create PR for your branch, and it should trigger Workflow run. In the output you can see some interesting [env vars](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/store-information-in-variables#default-environment-variables), which would be useful later:
```
GITHUB_ACTION=changed  
GITHUB_ACTION_PATH=/home/runner/work/<repo-name>/<repo-name>/./.github/actions/changed-files  
GITHUB_API_URL=https://api.github.com  
GITHUB_OUTPUT=/home/runner/work/_temp/_runner_file_commands/set_output_23024361-cb72-4531-ba92-94f3f347b7d6  
GITHUB_WORKSPACE=/home/runner/work/<repo-name>/<repo-name>
GITHUB_REF_NAME=<pr-num>/merge  
GITHUB_REPOSITORY=<org-name>/<repo-name>
INPUT_GROUPS_YAML=test-input
INPUT_GROUPS_YAML_FILE= 
```

Passing information between steps via `env` seems a little bit strange to me, but per [docs](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/passing-information-between-jobs) that is the only way. Previously you could also do:
```yaml
run: echo "::set-output name={name}::{value}"
# the same as 
run: echo "{name}={value}" >> $GITHUB_OUTPUT  
```
But it is [deprecated](https://github.blog/changelog/2022-10-11-github-actions-deprecating-save-state-and-set-output-commands/  )
### Get changed files
Now to the meat of our Action, how to actually detect the changed files? We plan to run the Action for Pull Requests, which are open for some branch to be merged to `master`. There are 2 ways:
- `git diff --name-only master...HEAD`
  That should list all files changed in the branch starting from `merge-base`. Problem with that is [actions/checkout](https://github.com/actions/checkout) by default clone as `fetch-depth: 1`. I.e you only has a shallow clone with one single latest commit (branch HEAD). To make this command working need to increase depth to at least so many commits, as it could be in a branch since it was forked from master. That means you need to clone the whole repo, to make it 100% working.
- Via GitHub API call [list pull requests files](https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28#list-pull-requests-files)
  That would return the same information in a json. No need to clone the full repo. But if the repo is private, this needs `GITHUB_TOKEN` with `contents: read` permission (the same which was already used in `actions/checkout` before).

We have a large repo, and my test shows that API request is faster than time needed for full clone. So in this example I'll continue with API way, and you probably would change the code anyway for your use-case.
Let's check that API is as described, and there are necessary permissions. Tune our test Action to:

```yaml  
# .github/actions/changed-files/action.yml
...
      run: |
        PR=`echo $GITHUB_REF_NAME | cut -d/ -f1`
        curl -iL \
          -H "Accept: application/vnd.github+json" \
          -H "Authorization: Bearer $GITHUB_TOKEN" \
          -H "X-GitHub-Api-Version: 2022-11-28" \
          https://api.github.com/repos/$GITHUB_REPOSITORY/pulls/$PR/files
          
        echo 'groups=["a", "b"]' >> $GITHUB_OUTPUT
```
Ok, that would be one of our script Inputs, but what should be the output?
### The Matrix
Suppose we have such file structure in the repo:
```
repo/
└── components
    ├── component-A
    │   └── values.yaml
    ├── component-B
    │   ├── values.yaml
    ...
```
And we want to know the `component name` which has any related file changed.
For example:
```yaml
      - id: changed  
        uses: ./.github/actions/changed-files  
        with:  
          groups_yaml: |
            component-A:
              - components/component-A/*
            component-B:
              - components/component-B/*
              - shared_libs/lib-B/*
```
- If `component-A` file was changed, then only run tests for it, skipping tests for `component-B` and everything else in the monorepo.
  In this case our Action should return single-dimension array: `["component-A"]` which would create single new `job` with argument of `"component-A"`.
- If both file groups were changed, we return `["component-A", "component-B"]` to the matrix. This starts 2 jobs running simultaneously. First one with argument `"component-A"`, and second one with `"component-B"`.
- We should consider group as `changed` if any it's fileglob matches any of changed files in the branch.
- What to do if `components/component-A` folder was removed in the branch? API would return it's files as `status=removed`. And I believe we should return such `group` as changed in the Action. Because it does not know if deletion of the file or dir affects others or not. That should trigger a `job` for `component-A` and only at this level we should decide what to do with it, because only here we know what actually this component does. In simplest case we can just mark step as "green":
  ```bash
  cd components/${{ matrix.id }} || { echo "::notice::Dir deleted, skipping..."; exit 0;}
  # run tests
  ```
- That covers simple cases, but usually single argument is not enough inside the `job` to do everything. In this case you can use list-of-dicts instead of our list-of-strings for matrix input. For example:
  `[{"component": "component-A", "role": "readonly"}]`
  then multiple values would be available inside the created job:
  ```yaml
  work:  
    name: "${{ matrix.id.component }}"
    runs-on: ubuntu-latest
    needs: [prepare]
    strategy:
      fail-fast: false
      matrix:
        id: ${{ fromJson(needs.prepare.outputs.matrix) }}
    steps:
    - run: |
        echo "${{ matrix.id.component }}"
        echo "${{ matrix.id.role }}"
  ```
[Read more](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/running-variations-of-jobs-in-a-workflow) details about `matrix` strategy.
## Show me the code
This information was enough to start writing some code. I've wrote the script, PR got merged, and tuned out I've forgot one more important thing. We've only discussed getting changed files while we're in a branch state. We use `groups` to run tests here. But after a merge, we want to know the same `groups` to build or deploy only changed components.
We can use [get-a-commit](https://docs.github.com/en/rest/commits/commits?apiVersion=2022-11-28#get-a-commit) API call here.
And mode could be detected via env:
```bash
GITHUB_REF_NAME=<pr-num>/merge # PR
GITHUB_REF_NAME=master # after it is merged
```
With that in mind here is the first version of `.github/actions/changed-files/action.py`:
```python
#!/usr/bin/env python  
import os  
import sys  
import requests  
import re  
import yaml  
import fnmatch  
import json  
  
def fail(message) -> None:  
    print(f"::error::{message}")  
    sys.exit(1)  
  
def log(title: str, message: str) -> None:  
    print(f"::group::{title}\n{message}\n::endgroup::")  
  
# https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api  
def get_changed_files() -> list:  
    ref = os.getenv('GITHUB_REF_NAME')  
    merge = re.match(r'^\d+/merge$', ref)  
    if merge:  
        # PR: https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28#list-pull-requests-files  
        url = f"https://api.github.com/repos/{os.getenv('GITHUB_REPOSITORY')}/pulls/{ref.split('/')[0]}/files"  
    else:  
        # commit: https://docs.github.com/en/rest/commits/commits?apiVersion=2022-11-28#get-a-commit  
        url = f"https://api.github.com/repos/{os.getenv('GITHUB_REPOSITORY')}/commits/{os.getenv('GITHUB_SHA')}"  
  
    headers = {  
        "Accept": "application/vnd.github+json",  
        "Authorization": f"Bearer {os.getenv('GITHUB_TOKEN')}",  
        "X-GitHub-Api-Version": "2022-11-28"  
    }  
    files = []  
    page = 1  
    while True:  
        response = requests.get(url, headers=headers, params={'per_page': 100, 'page': page})  
        if response.status_code != 200:  
            fail(f"Failed to get PR files {response.status_code}: {response.text}")  
        if not (data := response.json()):  
            break  
        files += [obj['filename'] for obj in (data if merge else data['files'])]  
        if 'rel="next"' not in response.headers.get('Link', ''):  
            break  
        page += 1  
    log('Changed files:', '\n'.join(sorted(files)))  
    return files  
  
def set_out(key: str, value: str):  
    with open(os.getenv('GITHUB_OUTPUT'), "a") as f:  
        f.write(f'{key}={value}\n')  
  
def get_config(name: str) -> dict:  
    data = os.getenv(f'INPUT_{name.upper()}_YAML')  
    path = os.getenv(f'INPUT_{name.upper()}_YAML_FILE')  
    if data and path:  
        fail(f"Both mutually exclusive `{name}_yaml` and `{name}_yaml_file` are set")  
    if path:  
        with open(path, 'r') as f:  
            data = f.read()  
    return yaml.safe_load(data) if data else {}  
  
def get_changed_groups(groups: dict, changed_files: list) -> list:  
    res = []  
    for group, globs in groups.items():  
        if any(fnmatch.filter(changed_files, glob) for glob in globs):  
            res.append(group)  
    return res  
  
if __name__ == "__main__":  
    groups = get_config('groups')  
    if not groups:  
        fail(f"Neither `groups_yaml` nor `groups_yaml_file` is set")  
  
    out = get_changed_groups(groups, get_changed_files())  
    log('Changed groups:', json.dumps(out))  
    set_out('groups', json.dumps(out))
```

## Reality
You can use it for some inspiration. But first thing that comes to my mind when I've start to use it, is that we've replaced "100 workflow files" with yaml having "100 similar file groups defined":
```yaml
     - id: changed  
        uses: ./.github/actions/changed-files  
        with:  
          groups_yaml: |
            component-A:
              - components/component-A/*
            component-B:
              - components/component-B/*
            component-C:
              - components/component-C/*
            ...
```
If repo has some order, wouldn't it be nice to have something like that?
```yaml
        with:  
          regex_yaml: |
            components:
              - components/(component-[^/]+)/.*
```
which would return all matched regex "capture groups":
`[{"group": "components", "match1": "component-A"}]`

That could be done by adding something like that to our Action:
```python
def get_regex_groups(groups: dict, changed_files: list) -> list:  
    res = []  
    changed = '\n'.join(changed_files)  
    for group, regexes in groups.items():  
        for regex in regexes:  
            for m in re.finditer(f'^{regex}$', changed, re.MULTILINE):  
                obj = {"group": group, **{f"match{i+1}": val for i, val in enumerate(m.groups()) if val}}  
                if obj not in res:  
                    res.append(obj)  
    return res
```

Adding it took 15min, and such a feature is not supported by the original [tj-actions/changed-files](https://github.com/tj-actions/changed-files).
That is an example of a GitHub Action in Python, and now you can add a custom logic to better handle the structure of your monorepo.
