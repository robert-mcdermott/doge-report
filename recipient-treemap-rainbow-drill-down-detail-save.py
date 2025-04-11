import pandas as pd
import plotly.express as px

# Load dataset
df = pd.read_csv("doge_grants_data.csv")

# Create a label for each individual savings entry
df["savings_entry"] = df["date"].astype(str) + " | $" + df["savings"].round(0).astype(int).astype(str)

# Create the treemap
fig = px.treemap(
    df,
    path=["recipient", "savings_entry"],
    values="savings",
    title="Drill-down Treemap: Total and Individual Savings by Recipient",
    color="savings",
    hover_data={
        "savings": True,
        "description": True,
        "savings_entry": False  # hide this from tooltip
    },
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
    margin=dict(t=50, l=25, r=25, b=25),
    coloraxis_colorbar=dict(
        title="Savings (USD)",
        tickprefix="$"
    )
)

# Save to an HTML file
fig.write_html("recipient_savings_treemap.html")

print("✅ Treemap saved as 'recipient_savings_treemap.html'")

