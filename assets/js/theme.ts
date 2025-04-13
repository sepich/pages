function initToc() {
    const toc = document.getElementById("TableOfContents");
    // Return directly if no toc
    if (toc === null) return;

    const tocLinkElements = toc.querySelectorAll("a:first-child");
    const mainNavLinks = document.querySelectorAll("#TableOfContents li a");
    const TOP_SPACING = 21;
    const minTocTop = toc.offsetTop;
    const minScrollTop = minTocTop - TOP_SPACING;
    window._tocOnScroll = window._tocOnScroll ||
        (() => {
            const footerTop = document.getElementById("post-footer").offsetTop;
            const maxTocTop = footerTop - toc.getBoundingClientRect().height;
            const maxScrollTop = maxTocTop - TOP_SPACING;
            if (window.newScrollTop < minScrollTop) {
                // If scroll to the top of the page
                // Set toc to absolute
                toc.style.position = "absolute";
                toc.style.top = `${minTocTop}px`;
            } else if (window.newScrollTop > maxScrollTop) {
                // If scroll to the bottom of the page
                // Set toc to absolute
                toc.style.position = "absolute";
                toc.style.top = `${maxTocTop}px`;
            } else {
                // If in the middle
                // Set toc to fixed with TOP_SPACING
                toc.style.position = "fixed";
                toc.style.top = `${TOP_SPACING}px`;
            }
            // Return directly if no toc link
            if (tocLinkElements.length === 0) return;

            // Update the active toc link
            let id = -1;
            const pos = TOP_SPACING + window.newScrollTop;
            for (let i = mainNavLinks.length - 1; i >= 0; i--) {
                let h = document.querySelector(mainNavLinks[i].hash);
                if (h.offsetTop <= pos && id == -1) {
                    id = i;
                    mainNavLinks[i].classList.add("current");
                } else {
                    mainNavLinks[i].classList.remove("current");
                }
            }
            // Mark parents as active too
            if (id >= 0 && id < mainNavLinks.length) {
              let parent = mainNavLinks[id].parentElement.parentElement.parentElement;
              while (parent.tagName == 'LI' && parent.childElementCount > 1) {
                parent.querySelector('a').classList.add("current");
                parent = parent.parentElement.parentElement;
              }
            }
        });
    window._tocOnScroll();
    window.scrollEventSet.add(window._tocOnScroll);
}

function getScrollTop() {
  return (
    (document.documentElement && document.documentElement.scrollTop) ||
    document.body.scrollTop
  );
}

function onScroll() {
  function handleScrollEvent() {
    window.newScrollTop = getScrollTop();
    for (const event of window.scrollEventSet) event();
  }
  window.addEventListener("scroll", handleScrollEvent, false);
}

function init() {
    window.newScrollTop = getScrollTop();
    window.scrollEventSet = new Set();
    initToc();
    onScroll();
}

init();
