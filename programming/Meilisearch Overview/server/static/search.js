const meilisearch_url = "http://localhost:7700"

const papers_available = document.getElementById("papers-available");
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
async function get_number_of_documents() {
    const res = await fetch(new String(meilisearch_url + '/indexes/papers/stats'), {
        // headers: new Headers({
        //     "ngrok-skip-browser-warning": "69420",
        //   })
    });
    const json = await res.json();
    return json["numberOfDocuments"];
  }
async function get_papers_available() {
    number_of_documents = await get_number_of_documents();
    papers_available.innerText = new String("Papers available: " +  numberWithCommas(number_of_documents));
}
addEventListener("load", get_papers_available);


const papers_list = document.getElementById("papers-list");
const execution_time = document.getElementById("execution-time");
const estimated_count = document.getElementById("estimated-count");
const pagination = document.getElementById("pagination");
const current_page = document.getElementById("current-page");

async function render_papers(papers) {
    console.log(papers);    
    if (papers.estimatedTotalHits) {
        estimated_count.dataset.estimated_count = papers.estimatedTotalHits;
        if (papers.estimatedTotalHits == 1000) 
            estimated_count.innerText = new String("Estimated count: >1000");
        else 
            estimated_count.innerText = new String("Count (total): " + papers.estimatedTotalHits);
        estimated_count.classList.remove("hidden");
        pagination.classList.remove("hidden");
    } else {
        estimated_count.dataset.estimated_count = 0;
        estimated_count.innerText = new String("No papers found. Try again.");
    }
    while (papers_list.firstChild) {
        papers_list.removeChild(papers_list.firstChild);
    }

    papers.hits.forEach(element => {
        let child = document.createElement("li");
        child.classList.add("paper");
        let link = document.createElement("a");
        link.href = new String("https://arxiv.org/abs/" + element.id.replace("-", "."));
        link.innerText = element.title;
        child.appendChild(link);
        let id = document.createElement("p");
        id.innerText = element.id;
        child.appendChild(id);
        let authors = document.createElement("p");
        authors.innerText = element.authors;
        child.appendChild(authors);
        let abstract = document.createElement("p");
        abstract.classList.add("abstract");
        abstract.classList.add("overflow");
        abstract.addEventListener("click", (e) => {e.target.classList.remove("overflow")});
        abstract.innerText = element.abstract;
        child.appendChild(abstract);
        papers_list.appendChild(child);
    });
    console.log(papers_list);
}

async function perform_search(e, page=1) {
    current_page.dataset.current_page = page;
    current_page.innerText = new String("Page: " + page);
    console.log(e);
    var offset = (page-1) * 20;
    if ("target" in e)
        var q = e.target.value;
    else
        var q = e.value;
    const start = Date.now();
    const response = await fetch(new String(meilisearch_url + "/indexes/papers/search"), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            // "ngrok-skip-browser-warning": "69420",
        },
        body: JSON.stringify({"q": q, "offset": offset}),
    });
    const papers = await response.json();
    const end = Date.now();
    execution_time.dataset.execution_time = end - start;
    execution_time.innerText = new String("Execution time (for single page): " + execution_time.dataset.execution_time + " ms");
    execution_time.classList.remove("hidden");
    if (papers.estimatedTotalHits > 20)
        next_page_btn.classList.remove("hidden");
    else
        next_page_btn.classList.add("hidden");
    await render_papers(papers);
}
const el = document.getElementById("search");
el.addEventListener("input", perform_search, false);

const next_page_btn = document.getElementById("next-page-btn");
async function get_next_page() {
    var page = parseInt(current_page.dataset.current_page) + 1;
    await perform_search(el, page);
    var offset = (page) * 20;
    if (offset + 20 > estimated_count.dataset.estimated_count) {
        next_page_btn.classList.add("hidden");
    }
    prev_page_btn.classList.remove('hidden');
}
next_page_btn.addEventListener("click", get_next_page)

const prev_page_btn = document.getElementById("prev-page-btn");
async function get_prev_page() {
    var page = parseInt(current_page.dataset.current_page) - 1;
    await perform_search(el, page);
    var offset = (page) * 20;
    if (offset - 20 <= 0) {
        prev_page_btn.classList.add("hidden");
        next_page_btn.classList.remove("hidden");
    }
}
prev_page_btn.addEventListener("click",  get_prev_page)