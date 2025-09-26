from flask import Flask, render_template, jsonify
from openaq import OpenAQ

app = Flask(__name__)
client = OpenAQ(api_key="f8e124960439ed66813ddb7d0937bbc7b53284569a9f44fc0ca9d1f11c356c01")

tn_bbox = (76.0, 8.0, 80.5, 13.6)

tn_locations = client.locations.list(
    bbox=tn_bbox,
    limit=100
)

locations_info = {
    loc.id: {
        "name": loc.name,
        "coordinates": (loc.coordinates.latitude, loc.coordinates.longitude)
    }
    for loc in tn_locations.results if loc.coordinates
}


@app.route("/")
def home():
    return render_template("home.html")


@app.route("/map")
def map_page():
    return render_template("index.html", locations=locations_info)


@app.route("/data/<int:location_id>")
def get_location_data(location_id):
    """Fetch latest measurements for all sensors at a location"""
    try:
        location = next((loc for loc in tn_locations.results if loc.id == location_id), None)
        if not location:
            return jsonify({"error": "Location not found"}), 404

        data = []
        for sensor in location.sensors:
            measurements = client.measurements.list(
                sensors_id=sensor.id,
                limit=1
            )

            if measurements.results:
                m = measurements.results[0]
                entry = {
                    "parameter": sensor.parameter.display_name,
                    "value": m.value,
                    "unit": sensor.parameter.units,
                    "time": getattr(m.period.datetime_to, "local", None)
                }
                data.append(entry)

        return jsonify(data)

    except Exception:
        return jsonify({"error": "No Data Found"}), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
