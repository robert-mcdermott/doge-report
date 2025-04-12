import pandas as pd
import plotly.express as px

# Load dataset
df = pd.read_csv("doge_grants_data.csv")

# Convert 'savings' to numeric, force errors to NaN
df['savings'] = pd.to_numeric(df['savings'], errors='coerce')

# Drop rows with missing or invalid data in required fields
df = df.dropna(subset=['agency', 'recipient', 'savings', 'description'])

# Filter out non-positive savings (optional)
df = df[df['savings'] > 0]

# Create a unique savings entry label
df["savings_entry"] = df["date"].astype(str) + " | $" + df["savings"].round(0).astype(int).astype(str)

# Compute 95th percentile of savings (or 90th if you want it more aggressive)
cap = df['savings'].quantile(1.0)

# Create the treemap
fig = px.treemap(
    df,
    path=["agency", "recipient", "savings_entry"],
    values="savings",
    title="<b>DOGE Canceled Grants</b> - Click to drill-down: Agency → Recipient → Grant - <i>(click top gray bar to reset)</i>",
    color="savings",
    range_color=[0, cap],
    hover_data={
        "savings": True,
        "description": True,
        "savings_entry": False
    },

    #color_continuous_scale="Cividis",
    #color_continuous_scale="Viridis",
    #color_continuous_scale="Rainbow",
    #color_continuous_scale="Turbo",
    #color_continuous_scale="Inferno",
    #color_continuous_scale="Plasma",
    color_continuous_scale=[
        [0.0, "blue"],
        [0.2, "cyan"],
        [0.4, "green"],
        [0.6, "yellow"],
        [0.8, "orange"],
        [1.0, "red"]
    ]
)

fig.update_layout(
    margin=dict(t=30, l=25, r=25, b=25),
    coloraxis_showscale=False
)

# Save to HTML
fig.write_html("doge_grants_savings_treemap.html")

print("✅ Treemap saved with cleaned data")

