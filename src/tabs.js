
window.addEventListener('load', function () {
  const myTabs = document.querySelectorAll('ul.nav-tabs > li')
  function myTabClicks (tabClickEvent) {
    for (let i = 0; i < myTabs.length; i++) {
      myTabs[i].classList.remove('active')
    }
    const clickedTab = tabClickEvent.currentTarget
    clickedTab.classList.add('active')
    tabClickEvent.preventDefault()
    const myContentPanes = document.querySelectorAll('.tab-pane')
    for (let i = 0; i < myContentPanes.length; i++) {
      myContentPanes[i].classList.remove('active')
    }
    const anchorReference = tabClickEvent.target
    const activePaneId = anchorReference.getAttribute('href')
    const activePane = document.querySelector(activePaneId)
    activePane.classList.add('active')
  }
  for (let i = 0; i < myTabs.length; i++) {
    myTabs[i].addEventListener('click', myTabClicks)
  }
})
