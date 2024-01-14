import json
import random

def generate_asset_data():
    assets = []

    for i in range(1, 1001):
        asset = {
            "name": f"Tank-{str(i).zfill(3)}",
            "longitude": round(random.uniform(5.8, 15.1), 6),  # Germany longitude range
            "latitude": round(random.uniform(47.3, 54.9), 6),   # Germany latitude range
            "asset-type": random.choice(["Gas", "Helium"]),
            "alarm-status": (
                "critical" if i <= 3 else
                "major" if 4 <= i <= 6 else
                "minor" if 7 <= i <= 9 else
                "none"
            )
        }
        assets.append(asset)

    return assets

# Generate dataset
assets_data = generate_asset_data()

# Save dataset to a JSON file
with open("assets_data.json", "w") as json_file:
    json.dump(assets_data, json_file, indent=2)