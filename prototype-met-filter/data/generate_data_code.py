import json
import random
import string

def generate_random_code(length=5):
    """Generate a random alphanumeric code."""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

def generate_asset_data():
    assets = []

    for i in range(1, 1001):
        # Generate a unique tank name with a random 5-letter code
        tank_code = generate_random_code()
        tank_name = f"Tank-{tank_code}"

        asset = {
            "name": tank_name,
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
