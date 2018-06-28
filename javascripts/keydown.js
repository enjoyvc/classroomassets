window.document.onkeydown = vckeydown;
window.document.onkeyup = vckeyup;
window.document.pressCtrl = false;

function vckeydown(e) {
    switch (e.keyCode) {
        case 17: window.document.pressCtrl = true; break;
    }
}

function vckeyup(e) {
    switch (e.keyCode) {
        case 17: window.document.pressCtrl = false; break;
    }
}
