let menuVisible = false;
//Función que oculta o muestra el menu
function mostrarOcultarMenu(){
    if(menuVisible){
        document.getElementById("nav").classList ="";
        menuVisible = false;
    }else{
        document.getElementById("nav").classList ="responsive";
        menuVisible = true;
    }
}

function seleccionar(){
    //oculto el menu una vez que selecciono una opcion
    document.getElementById("nav").classList = "";
    menuVisible = false;
}
//Funcion que aplica las animaciones de las habilidades
function efectoHabilidades(){
    var skills = document.getElementById("skills");
    var distancia_skills = window.innerHeight - skills.getBoundingClientRect().top;
    if(distancia_skills >= 300){
        let habilidades = document.getElementsByClassName("progreso");
        habilidades[0].classList.add("A");
        habilidades[1].classList.add("B");
        habilidades[2].classList.add("C");
        habilidades[3].classList.add("D");
        habilidades[4].classList.add("E");
        habilidades[5].classList.add("F");
        habilidades[6].classList.add("G");
        habilidades[7].classList.add("H");
        habilidades[8].classList.add("I");
        habilidades[9].classList.add("J");
        habilidades[10].classList.add("K");
        habilidades[11].classList.add("L");
        habilidades[12].classList.add("M");
        habilidades[13].classList.add("N");
    }
}


//detecto el scrolling para aplicar la animacion de la barra de habilidades
window.onscroll = function(){
    efectoHabilidades();
} 