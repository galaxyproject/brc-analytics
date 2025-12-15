import json
import os
import tkinter as tk
from io import BytesIO
from tkinter import messagebox

import pandas as pd
import requests
from bs4 import BeautifulSoup
from ete3 import NCBITaxa
from PIL import Image, ImageTk


def get_scientific_name_from_tsn(tsn_list):
    ncbi = NCBITaxa()
    results = []

    # Ensure the input is a list of unique values
    unique_tsns = list(set(tsn_list))

    # Fetch names in batches or sequentially
    print(f"Attempting to convert {len(unique_tsns)} TSNs...")

    for tsn in unique_tsns:
        try:
            # Use the 'get_scientific_name_from_tsn' function from pytaxize.itis
            name = ncbi.get_taxid_translator([tsn])[tsn]

            if name and isinstance(name, str):
                results.append({"TSN": tsn, "Scientific_Name": name.strip()})
            else:
                # Handle cases where the ID is found but the name is empty/not a string
                results.append({"TSN": tsn, "Scientific_Name": "Name Not Found"})

        except Exception as e:
            # Handle API/network errors or IDs that don't exist
            print(f"Error converting TSN {tsn}: {e}")
            results.append({"TSN": tsn, "Scientific_Name": "N/A (Error)"})

    # Convert the list of dictionaries to a DataFrame
    return pd.DataFrame(results)


def search_commons_images(query, limit=5):
    url = "https://commons.wikimedia.org/w/api.php"
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrsearch": query,
        "gsrnamespace": "6",  # namespace 6 = File:
        "gsrlimit": limit,
        "prop": "imageinfo",
        "iiprop": "url|extmetadata",
        "iiurlwidth": 800,  # Thumbnail width
        "iiurlheight": 800,
    }

    headers = {
        "User-Agent": "MyImageSearchBot/1.0 (https://yourdomain.org; email@example.com)"
    }

    r = requests.get(url, params=params, headers=headers)
    r.raise_for_status()
    data = r.json()

    results = []
    if "query" in data:
        for page in data["query"]["pages"].values():
            info = page.get("imageinfo", [{}])[0]
            # create a popup showing the image asking if we want to save this information
            results.append(
                {
                    "title": page["title"],
                    "url": info.get("url"),
                    "metadata": info.get("extmetadata", {}),
                    "thumbnail": info.get("thumburl"),
                    "width": info.get("width"),
                    "height": info.get("height"),
                }
            )

    return results


def search_wikimedia_for_image(scientific_name, header):
    """Searches Wikimedia Commons for an image and returns the URL of the first result."""
    search_url = "https://commons.wikimedia.org/w/index.php"
    params = {
        "search": scientific_name,
        "title": "Special:MediaSearch",
        "type": "image",
    }

    try:
        response = requests.get(search_url, params=params, headers=header)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        # Find the first search result link
        first_result = soup.find("a", class_="sd-file-link")
        if first_result and first_result.has_attr("href"):
            return first_result["href"]
    except requests.exceptions.RequestException as e:
        print(f"Error searching for {scientific_name}: {e}")
    return None


def select_image_from_options(images_info, scientific_name):
    """
    Creates a Tkinter window to display multiple image thumbnails, allows
    selecting one to view, and then saving or discarding.
    """
    headers = {
        "User-Agent": "MyImageSearchBot/1.0 (https://yourdomain.org; email@example.com)"
    }

    if not images_info:
        return None, None, None, None

    result = {"selected_image": None}
    root = tk.Tk()
    root.title(f"Select an image for {scientific_name}")

    # --- Top frame for thumbnails ---
    thumb_frame = tk.Frame(root)
    thumb_frame.pack(fill="x", padx=10, pady=5)

    # --- Middle frame for selected image and its info ---
    main_frame = tk.Frame(root)
    main_frame.pack(expand=True, fill="both", padx=10, pady=5)

    selected_image_label = tk.Label(main_frame)
    selected_image_label.pack(pady=5)
    info_label = tk.Label(main_frame, justify=tk.LEFT, wraplength=500)
    info_label.pack(pady=5)

    def on_thumbnail_click(image_info):
        try:
            # Fetch and display the larger image
            response = requests.get(image_info["thumbnail"], headers=headers)
            response.raise_for_status()
            img_data = response.content
            img = Image.open(BytesIO(img_data))
            photo = ImageTk.PhotoImage(img)

            selected_image_label.config(image=photo)
            selected_image_label.image = photo  # Keep reference

            # Update metadata display
            metadata = image_info.get("metadata", {})
            author_html = metadata.get("Artist", {}).get("value", "Unknown Author")
            author = BeautifulSoup(author_html, "html.parser").get_text(strip=True)
            license_name = metadata.get("LicenseShortName", {}).get(
                "value", "Unknown License"
            )
            info_text = f"Title: {image_info['title']}\nAuthor: {author}\nLicense: {license_name}\nSize: {img.width}x{img.height}"
            info_label.config(text=info_text)

            # Store the currently selected image info
            result["selected_image"] = image_info
            result["image_obj"] = img

        except Exception as e:
            messagebox.showerror("Image Error", f"Could not load image: {e}")
            info_label.config(text=f"Error loading image: {e}")

    def on_save():
        if result["selected_image"]:
            root.destroy()
        else:
            messagebox.showwarning(
                "No Selection", "Please select an image before saving."
            )

    def on_discard():
        result["selected_image"] = None
        root.destroy()

    # --- Bottom frame for buttons ---
    button_frame = tk.Frame(root)
    button_frame.pack(pady=10)
    save_button = tk.Button(button_frame, text="Save", command=on_save, width=15)
    save_button.pack(side=tk.LEFT, padx=10)
    discard_button = tk.Button(
        button_frame, text="Discard", command=on_discard, width=15
    )
    discard_button.pack(side=tk.RIGHT, padx=10)

    # --- Populate thumbnails ---
    thumbnail_photos = []  # Keep references
    for i, image_info in enumerate(images_info):
        try:
            response = requests.get(image_info["thumbnail"], headers=headers)
            response.raise_for_status()
            img = Image.open(BytesIO(response.content))
            img.thumbnail((100, 100))
            photo = ImageTk.PhotoImage(img)
            thumbnail_photos.append(photo)

            thumb_button = tk.Button(
                thumb_frame,
                image=photo,
                command=lambda info=image_info: on_thumbnail_click(info),
            )
            thumb_button.pack(side=tk.LEFT, padx=5)
        except Exception as e:
            print(f"Could not load thumbnail for {image_info['title']}: {e}")

    # Select the first image by default
    if images_info:
        on_thumbnail_click(images_info[0])

    root.mainloop()

    if result["selected_image"]:
        return result["selected_image"]
    return None


def fetch_image_info_for_organisms(scientific_names_df, output_json_path):
    """
    Iterates through a DataFrame of scientific names, finds images, and extracts details.
    """
    all_image_data = {}
    if os.path.exists(output_json_path):
        with open(output_json_path, "r") as f:
            all_image_data = json.load(f)

    for index, row in scientific_names_df.iterrows():
        scientific_name = row["Scientific_Name"]
        if scientific_name == "Name Not Found" or scientific_name == "N/A (Error)":
            continue

        if (
            scientific_name in all_image_data
            and all_image_data[scientific_name]["image_url"] is not None
        ):
            print(f"{scientific_name} already processed. Skipping.")
            continue

        print(f"\n{index}:  Processing: {scientific_name}")

        images = search_commons_images(scientific_name, limit=20)

        if images:
            selected_image = select_image_from_options(images, scientific_name)

            if selected_image:
                print(
                    f"  Image '{selected_image['title']}' saved for {scientific_name}."
                )
                metadata = selected_image.get("metadata", {})
                author_html = metadata.get("Artist", {}).get("value", "Unknown Author")
                author = BeautifulSoup(author_html, "html.parser").get_text(strip=True)
                license_name = metadata.get("LicenseShortName", {}).get(
                    "value", "Unknown License"
                )

                all_image_data[scientific_name] = {
                    "scientific_name": scientific_name,
                    "author": author,
                    "license": license_name,
                    "image_source_name": "Wikimedia",
                    "image_url": selected_image.get("url"),
                }
            else:
                print(f"  No image selected for {scientific_name}.")
                # Record that we've processed this but have no image
                all_image_data[scientific_name] = {
                    key: None
                    for key in [
                        "scientific_name",
                        "author",
                        "license",
                        "image_url",
                        "thumbnail_url",
                        "thumbnail_width",
                        "thumbnail_height",
                    ]
                }
                all_image_data[scientific_name]["scientific_name"] = scientific_name
        else:
            print(f"  No images found for {scientific_name}.")
            all_image_data[scientific_name] = {
                key: None
                for key in [
                    "scientific_name",
                    "author",
                    "license",
                    "image_url",
                    "thumbnail_url",
                    "thumbnail_width",
                    "thumbnail_height",
                ]
            }
            all_image_data[scientific_name]["scientific_name"] = scientific_name

        with open(output_json_path, "w") as f:
            json.dump(all_image_data, f, indent=4)
        # Save all_image_data to a temporary local file that can be used to retrieve information if the script crashes
    return pd.DataFrame(all_image_data)


# Function used to download images using the image_url key from all_image_data.json putting them in a folder named images.
def download_images(
    image_data_json_path="all_image_data.json", download_folder="images"
):
    """
    Downloads images based on the 'image_url' in the all_image_data.json file.
    Images are saved into the specified download_folder.
    """
    if not os.path.exists(image_data_json_path):
        print(f"Error: {image_data_json_path} not found.")
        return

    if not os.path.exists(download_folder):
        os.makedirs(download_folder)
        print(f"Created download folder: {download_folder}")

    with open(image_data_json_path, "r") as f:
        all_image_data = json.load(f)

    headers = {
        "User-Agent": "MyImageSearchBot/1.0 (https://yourdomain.org; email@example.com)"
    }

    for scientific_name, data in all_image_data.items():
        image_url = data.get("image_url")
        if image_url:
            try:
                response = requests.get(image_url, headers=headers, stream=True)
                response.raise_for_status()

                # Extract filename from URL or generate a generic one
                filename = os.path.join(
                    download_folder, f"{scientific_name.replace(' ', '_')}.jpg"
                )

                with open(filename, "wb") as out_file:
                    for chunk in response.iter_content(chunk_size=8192):
                        out_file.write(chunk)
                print(f"Downloaded: {scientific_name} to {filename}")
            except requests.exceptions.RequestException as e:
                print(
                    f"Error downloading image for {scientific_name} from {image_url}: {e}"
                )
            except Exception as e:
                print(
                    f"An unexpected error occurred while downloading {scientific_name}: {e}"
                )
        else:
            print(f"No image URL found for {scientific_name}. Skipping download.")


# Run function as default
if __name__ == "__main__":
    INPUT_ORGANISMS = "catalog/ga2/source/organisms.yml"
    OUTPUT_IMAGE_DATA = "catalog/ga2/source/organism_image_data.json"
    # Load organisms list from catalog/ga2/source/organisms.json
    import yaml

    with open(INPUT_ORGANISMS, "r") as f:
        # Using FullLoader is not safe with untrusted input, but we trust this file.
        organisms_data = yaml.load(f, Loader=yaml.FullLoader)

    # Extract unique taxonomy_ids
    taxonomy_ids = [
        org["taxonomy_id"]
        for org in organisms_data["organisms"]
        if "taxonomy_id" in org
    ]
    unique_taxonomy_ids = list(set(taxonomy_ids))

    # # Convert TSNs to scientific names
    scientific_names_df = get_scientific_name_from_tsn(unique_taxonomy_ids)
    print("\nConversion Results:")
    print(scientific_names_df)

    # Fetch image details for the scientific names
    if not scientific_names_df.empty:
        image_info_df = fetch_image_info_for_organisms(
            scientific_names_df, OUTPUT_IMAGE_DATA
        )

    download_images(image_data_json_path=OUTPUT_IMAGE_DATA)
