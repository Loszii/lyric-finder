function set_thumbnail() {
    //searches cookies for information relating to the thumbnail
    const cookies = document.cookie;
    const parsed = cookies.split("; ");
    let image;
    let title;
    let artist;

    //get image url
    for (let i=0; i < parsed.length; i++) {
        if (parsed[i].slice(0, 6) == "image=") {
            image = parsed[i].slice(6);
            break;
        }
    }
    //get title
    for (let i=0; i < parsed.length; i++) {
        if (parsed[i].slice(0, 6) == "title=") {
            title = parsed[i].slice(6);
            break;
        }
    }
    //get artist
    for (let i=0; i < parsed.length; i++) {
        if (parsed[i].slice(0, 7) == "artist=") {
            artist = parsed[i].slice(7);
            break;
        }
    }

    if (image != undefined && title != undefined && artist != undefined) {
        let decoded_image = decodeURIComponent(image);
        if (decoded_image == "undefined") {
            decoded_image = "res/black.jpg";
        }
        const decoded_title = decodeURIComponent(title);
        const decoded_artist = decodeURIComponent(artist);
        document.getElementById("thumbnail").innerHTML = `<img src=${decoded_image}><h1>${decoded_title}</h1><h1>${decoded_artist}</h1>`
    }
}

async function get_lyrics() {
    //gets the lyrics from backend
    const res = await fetch("/api/lyrics")
    const data = await res.json();
    const lyrics = data["lyrics"];

    document.getElementById("lyrics").innerText = lyrics;
}

async function get_analysis(lyrics) {
    //analyzes highlighted lyrics and writes to analysis div
    const container = document.getElementById("analysis");
    container.innerHTML = "";

    const res = await fetch("/api/analysis", {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({"lyrics": lyrics})
    })
    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    //append each chunk of stream while reading and decoding
    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        } else {
            container.innerHTML += decoder.decode(value, { stream: true });
        }
    }

    //format the md
    const formatted = await fetch("/api/format", {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({"ai_text": container.innerHTML})
    })
    const formatted_data = await formatted.json();
    container.innerHTML = formatted_data["formatted"];

}

async function get_summary() {
    //gets the summary of song and writes to analysis div
    const container = document.getElementById("analysis");
    container.innerHTML = "";

    const res = await fetch("/api/summary", {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({"lyrics": document.getElementById("lyrics").innerHTML})
    })
    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    //append each chunk of stream while reading and decoding
    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        } else {
            container.innerHTML += decoder.decode(value, { stream: true });
        }
    }

    //format the md
    const formatted = await fetch("/api/format", {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({"ai_text": container.innerHTML})
    })
    const formatted_data = await formatted.json();
    container.innerHTML = formatted_data["formatted"];
}

document.getElementById("analyze-button").addEventListener("click", () => {
    //send the currently highlighted text to backend for analysis
    if (window.getSelection().toString().trim() != "") {
        lyrics = window.getSelection().toString();
        get_analysis(lyrics);
    } else {
        document.getElementById("analysis").innerHTML = "No Selected Content";
    }
})

async function main() {
    set_thumbnail();
    await get_lyrics();
    get_summary();
}

main();