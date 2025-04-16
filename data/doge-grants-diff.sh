jq -n --slurpfile old doge_grants_data-old.json --slurpfile new doge_grants_data-new.json '
# Create a composite key function
def make_key(obj):
  [obj.date, obj.agency, obj.recipient, obj.value] | join("|");

# Create a map of the old data using composite key
$old[0] | map({key: make_key(.), value: .}) | from_entries as $old_map |
# Find new or modified entries
$new[0] | map(
  # For each entry in the new file
  # Create the key
  . as $entry | make_key(.) as $key |
  if $old_map[$key] then
    # If the key exists in the old file, check if the content is different
    if . != $old_map[$key] then
      . + {status: "updated"}
    else
      empty
    end
  else
    # If the key does not exist in the old file, it is a new entry
    . + {status: "added"}
  end
)' > doge_grants_differences2.json
