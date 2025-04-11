import pandas as pd
import plotly.express as px

# Load dataset
df = pd.read_csv("doge_grants_data.csv")

# Create a new column to act as a unique label for each entry
df["savings_entry"] = df["date"].astype(str) + " | $" + df["savings"].round(0).astype(int).astype(str)

# Create the treemap with hierarchy: Recipient > Individual Entry
fig = px.treemap(
    df,
    path=["recipient", "savings_entry"],
    values="savings",
    title="Drill-down Treemap: Total and Individual Savings by Recipient",
    color="savings",
    hover_data={
        "savings": True,
        "description": True,
        "savings_entry": False  # hide the savings_entry column from the tooltip
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

fig.show()

