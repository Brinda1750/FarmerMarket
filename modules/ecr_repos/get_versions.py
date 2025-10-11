#!/usr/bin/env python3

import json
import subprocess
import sys

def get_latest_tag(image):
    """Get the latest tag for a Docker Hub image"""
    try:
        result = subprocess.run(
            ["skopeo", "list-tags", f"docker://{image}"],
            capture_output=True,
            text=True,
            check=True
        )
        tags = json.loads(result.stdout).get("Tags", [])
        # Filter for version tags and get the latest
        version_tags = [t for t in tags if t[0].isdigit()]
        if version_tags:
            return sorted(version_tags, reverse=True)[0]
        return "latest"
    except:
        return "latest"

def main():
    images = {
        "gotrue": "supabase/gotrue",
        "postgrest": "postgrest/postgrest",
        "realtime": "supabase/realtime",
        "storage": "supabase/storage-api",
        "studio": "supabase/studio"
    }

    versions = {}
    for service, image in images.items():
        versions[service] = get_latest_tag(image)

    print(json.dumps(versions))

if __name__ == "__main__":
    main()