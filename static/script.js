const map = L.map('map').setView([11.0, 78.0], 7);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

for (const [id, info] of Object.entries(locations)) {
    const coords = info.coordinates;
    if (!coords) continue;

    const marker = L.marker([coords[0], coords[1]]).addTo(map);

    marker.on("click", async () => {
        const popup = marker.getPopup() || L.popup().setLatLng([coords[0], coords[1]]);
        popup.setContent(`<b>${info.name}</b><br>Loading data...`);
        popup.openOn(map);

        try {
            const response = await fetch(`/data/${id}`);
            const data = await response.json();

            if (data.error) {
                popup.setContent(`<b>${info.name}</b><br>Error: ${data.error}`);
                return;
            }

            if (data.length === 0) {
                popup.setContent(`<b>${info.name}</b><br>No measurements available`);
                return;
            }

            let table = `
                <div style="font-size:13px; text-align:left;font-family:garamond";>
                    <h4 style="margin:5px 0; font-size:14px; color:#333;">${info.name}</h4>
                    <table style="border-collapse:collapse; width:100%;">
                        <thead>
                            <tr style="background:#4CAF50; color:white; text-align:left;">
                                <th style="padding:4px;">Parameter</th>
                                <th style="padding:4px;">Value</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            data.forEach(d => {
                table += `
                    <tr style="border-bottom:1px solid #ddd;">
                        <td style="padding:4px;">${d.parameter}</td>
                        <td style="padding:4px; font-weight:bold; color:#222; font-family:garamond">${d.value} ${d.unit}</td>
                    </tr>
                `;
            });

            table += `
                        </tbody>
                    </table>
                    <button onclick="showChart(${id})" style="margin-top:8px; padding:6px 12px; background:#2196F3; color:white; border:none; border-radius:5px; cursor:pointer;">
                        Visualize Chart
                    </button>
                </div>
            `;

            popup.setContent(table);
        } catch (err) {
            popup.setContent(`<b>${info.name}</b><br>Error fetching data`);
        }
    });
}

let chart;
async function showChart(locationId) {
    document.getElementById("chartContainer").style.display = "block";

    const response = await fetch(`/data/${locationId}`);
    const data = await response.json();

    if (chart) chart.destroy();

    const ctx = document.getElementById("aqChart").getContext("2d");
    chart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: data.map(d => d.parameter),
            datasets: [{
                label: "Air Quality Values",
                data: data.map(d => d.value),
                backgroundColor: "rgba(75, 192, 192, 0.6)"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const closeBtn = document.getElementById("closeChart");
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            document.getElementById("chartContainer").style.display = "none";
        });
    }
});
