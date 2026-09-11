/* Champions Lula — interfaz pública.
   Lee window.DATOS (lo genera generar.py) y pinta las seis secciones.
   Sin dependencias: se abre con doble clic o desde cualquier hosting. */

(function () {
  "use strict";

  var D = window.DATOS || {};
  var PART = {};
  (D.participantes || []).forEach(function (p) { PART[p.id] = p; });

  var SECCIONES = [
    { id: "resumen", eti: "Resumen", icono: "M3 12l9-8 9 8M5 10v9h14v-9" },
    { id: "general", eti: "General", icono: "M4 6h16M4 12h16M4 18h10" },
    { id: "jornada", eti: "Jornada", icono: "M4 5h16v15H4zM4 9h16M9 3v4M15 3v4" },
    { id: "mvp", eti: "MVP", icono: "M8 4h8v5a4 4 0 01-8 0zM9 20h6M12 13v7M5 5h3v3a3 3 0 01-3-3zM19 5h-3v3a3 3 0 003-3z" },
    { id: "cuadro", eti: "Cuadro", icono: "M4 5h6v5H4zM4 14h6v5H4zM14 9h6v6h-6zM10 7.5h2v8h2M10 16.5h2" },
    { id: "info", eti: "Info", icono: "M12 3a9 9 0 100 18 9 9 0 000-18zM12 11v5M12 8h.01" }
  ];

  // Orden de desempate de la general, tal cual manda el reglamento. Se muestra
  // bajo el titulo para que nadie tenga que preguntar por que va detras.
  var DESEMPATE_GENERAL =
    "puntos → jornadas ganadas → media de posición → ariete → goles → asistencias";
  var PISTA_DORADO =
    "En <b class='oro'>dorado</b>, la estadística que le separa del siguiente.";
  var DESEMPATE_JORNADA =
    "puntos → ariete → goles → asistencias → posición previa en la general";

  // ------------------------------------------------------------- utilidades

  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function nombre(id) {
    var p = PART[id];
    return p ? p.nombre : "?";
  }

  function iniciales(txt) {
    var partes = String(txt || "?").trim().split(/\s+/);
    return ((partes[0] || "?")[0] + (partes.length > 1 ? partes[1][0] : ""))
      .toUpperCase();
  }

  // Sin escudo cargado, cada equipo tiene un círculo con sus iniciales y un
  // color estable derivado de su id, para poder distinguirlos de un vistazo.
  function escudo(id, clase) {
    var p = PART[id] || {};
    clase = clase || "";
    if (p.escudo) {
      return '<img class="escudo ' + clase + '" src="' + esc(p.escudo) +
        '" alt="" loading="lazy">';
    }
    var tono = (id * 47) % 360;
    return '<span class="escudo escudo-txt ' + clase + '" style="background:' +
      'linear-gradient(160deg, hsl(' + tono + ',70%,72%), hsl(' +
      ((tono + 40) % 360) + ',65%,52%))">' + esc(iniciales(p.nombre)) + "</span>";
  }

  function flecha(m) {
    if (!m) return '<span class="mov igual">=</span>';
    if (m > 0) return '<span class="mov sube">▲' + m + "</span>";
    return '<span class="mov baja">▼' + Math.abs(m) + "</span>";
  }

  function media(v) { return v == null ? "—" : v.toFixed(2); }

  function vacio(titulo, texto) {
    return '<div class="tarjeta"><div class="vacio"><strong>' + esc(titulo) +
      "</strong>" + texto + "</div></div>";
  }

  function titulo(txt, extra, nota) {
    return '<div class="seccion-titulo"><h2>' + esc(txt) + "</h2>" +
      (extra ? "<span>" + esc(extra) + "</span>" : "") + "</div>" +
      (nota ? '<p class="nota">' + nota + "</p>" : "");
  }

  // -------------------------------------------------------- tabla comun

  /* Las clasificaciones son tablas de verdad: una columna por estadistica,
     que es como se leen de un vistazo sin tener que abrir cada fila. */

  function tabla(columnas, filas) {
    var cab = '<th class="c-pos">#</th><th class="c-eq">Participante</th>' +
      columnas.map(function (c) {
        // La cabecera lleva las mismas clases que sus celdas: asi el ancho
        // minimo se aplica a la columna entera y no solo a las filas.
        return '<th class="' + (c.clase || "") + (c.ancha ? " c-ancha" : "") +
          '" title="' + esc(c.ayuda || c.eti) + '">' + esc(c.eti) + "</th>";
      }).join("");

    var cuerpo = filas.map(function (f) {
      var celdas = columnas.map(function (c) {
        var marca = c.criterio && c.criterio === f.desempate ? " desempata" : "";
        return '<td class="' + (c.clase || "") + marca + '">' +
          c.valor(f) + "</td>";
      }).join("");
      return '<tr class="' + (f.estado || "") + (f.destacada ? " destacada" : "") +
        '"><td class="c-pos"><span class="badge">' + (f.badge || f.posicion) +
        "</span></td>" +
        '<td class="c-eq"><div class="eq">' + escudo(f.participante) +
        '<span class="eq-n">' + esc(nombre(f.participante)) + "</span>" +
        (f.aviso ? '<span class="eq-aviso" title="' + esc(f.aviso) +
          '">!</span>' : "") + "</div></td>" + celdas + "</tr>";
    }).join("");

    return '<div class="tarjeta"><div class="tabla-scroll"><table class="clas">' +
      "<thead><tr>" + cab + "</tr></thead><tbody>" + cuerpo +
      "</tbody></table></div></div>";
  }

  /* `criterio` empareja cada columna con el desempate que calcula el motor:
     la estadistica que separa a ese participante del de abajo se pinta en
     dorado, para que se vea de un vistazo por que va por delante. */
  var COL = {
    mov:  { eti: "+/−", ayuda: "Puestos ganados o perdidos en la última jornada",
            clase: "n-mov", valor: function (f) { return flecha(f.movimiento); } },
    pt:   { eti: "PT", ayuda: "Puntos totales", clase: "n-pt",
            criterio: "puntos", valor: function (f) { return f.puntos; } },
    pts:  { eti: "PTS", ayuda: "Puntos de la jornada", clase: "n-pt",
            criterio: "puntos", valor: function (f) { return f.puntos; } },
    jg:   { eti: "JG", ayuda: "Jornadas ganadas", criterio: "jornadas_ganadas",
            valor: function (f) { return f.jornadas_ganadas; } },
    med:  { eti: "MED", ayuda: "Media de posición por jornada", ancha: true,
            criterio: "media_posicion",
            valor: function (f) { return media(f.media_posicion); } },
    ari:  { eti: "ARI", ayuda: "Puntos de ariete (+3 por jornada acertada)",
            criterio: "ariete",
            valor: function (f) {
              return f.puntos_ariete ? f.puntos_ariete : "—";
            } },
    gf:   { eti: "GF", ayuda: "Goles", criterio: "goles",
            valor: function (f) { return f.goles; } },
    as:   { eti: "AS", ayuda: "Asistencias", criterio: "asistencias",
            valor: function (f) { return f.asistencias; } }
  };

  // Las mismas columnas en el resumen y en la general, para que nadie tenga
  // que aprenderse dos tablas distintas.
  var COLUMNAS_GENERAL = [COL.mov, COL.pt, COL.jg, COL.med, COL.ari,
                          COL.gf, COL.as];

  function leyenda() {
    return '<div class="leyenda">' +
      '<span><i style="background:var(--zona-directa)"></i>1-8 Octavos</span>' +
      '<span><i style="background:var(--zona-playoff)"></i>9-24 Play-off</span>' +
      '<span><i style="background:var(--zona-fuera)"></i>25-36 Eliminados</span>' +
      "</div>";
  }

  function conAviso(f) {
    return Object.assign({}, f, {
      aviso: f.inactivo ? "3 jornadas seguidas sin alinear" : ""
    });
  }

  // --------------------------------------------------------------- general

  function pintaGeneral() {
    if (!D.empezada) {
      return titulo("Clasificación general") +
        vacio("La competición no ha empezado",
          "Los " + (D.participantes || []).length + " equipos ya están " +
          "inscritos. En cuanto se dispute la primera jornada aparecerá aquí " +
          "la clasificación.");
    }
    return titulo("Clasificación general",
      "Jornada " + D.jornadas.length + " de " + D.reglas.jornadas_fase,
      "Desempates: " + DESEMPATE_GENERAL + ". " + PISTA_DORADO) +
      tabla(COLUMNAS_GENERAL, D.general.map(conAviso)) +
      leyenda();
  }

  // --------------------------------------------------------------- jornada

  var jornadaVista = null;

  function pintaJornada() {
    if (!D.jornadas.length) {
      return titulo("Clasificación por jornada") +
        vacio("Todavía no hay jornadas",
          "Cuando el administrador cierre la primera jornada, se podrá " +
          "consultar aquí su clasificación.");
    }
    if (jornadaVista == null) {
      jornadaVista = D.jornadas[D.jornadas.length - 1].numero;
    }
    var j = D.jornadas.filter(function (x) { return x.numero === jornadaVista; })[0]
      || D.jornadas[D.jornadas.length - 1];

    var botones = D.jornadas.map(function (x) {
      return '<button data-jornada="' + x.numero + '" aria-current="' +
        (x.numero === j.numero) + '">J' + x.numero + "</button>";
    }).join("");

    var filas = j.filas.map(function (f) {
      return Object.assign({}, f, {
        aviso: f.alineo ? "" : "No alineó esta jornada"
      });
    });

    return titulo("Clasificación por jornada", j.nombre,
      "Desempates: " + DESEMPATE_JORNADA + ". " + PISTA_DORADO) +
      '<div class="selector">' + botones + "</div>" +
      tabla([COL.pts, COL.ari, COL.gf, COL.as], filas);
  }

  // ------------------------------------------------------------------ mvp

  function pintaMVP() {
    var mvp = D.mvp || { tabla: [], apartados: [] };
    if (!D.empezada || !mvp.tabla.length) {
      return titulo("MVP Champions Lula") +
        vacio("El MVP arranca con la primera jornada",
          "Se reparten 1,00 al primero, 0,50 al segundo y 0,25 al tercero " +
          "de cada uno de los ocho apartados. Máximo: 8,00 puntos.");
    }
    var top = mvp.tabla.filter(function (f) { return f.total > 0; });
    return titulo("MVP Champions Lula", "máximo 8,00",
      "Se sigue sumando aunque estés eliminado. Empate: gana quien siga vivo " +
      "en la competición y, si no, quien mejor vaya en la general.") +
      podioHTML(top.slice(0, 3), function (f) { return f.total.toFixed(2); }) +
      titulo("Los ocho apartados") +
      '<div class="mvp-apartados">' +
      mvp.apartados.map(apartadoHTML).join("") + "</div>" +
      titulo("Clasificación del MVP") +
      tabla([
        { eti: "MVP", ayuda: "Puntos del MVP", clase: "n-pt",
          criterio: "total",
          valor: function (f) { return f.total.toFixed(2); } },
        { eti: "GEN", ayuda: "Posición en la clasificación general",
          criterio: "posicion_general",
          valor: function (f) { return f.posicion_general; } }
      ], top);
  }

  function apartadoHTML(a) {
    if (!a.podio.length) return "";
    return '<div class="apartado"><h3>' + esc(a.titulo) + "</h3>" +
      a.podio.map(function (e) {
        return '<div class="l"><span class="m">' + e.puesto + "º</span>" +
          escudo(e.participante) +
          '<span class="nm">' + esc(nombre(e.participante)) + "</span>" +
          '<span class="vl">' + esc(e.valor_mostrado) + "</span>" +
          '<span class="sm">' + e.suma.toFixed(2) + "</span></div>";
      }).join("") + "</div>";
  }

  function podioHTML(filas, valor) {
    var orden = [0, 1, 2];  // 1o, 2o y 3o de izquierda a derecha
    return '<div class="podio">' + orden.map(function (i) {
      var f = filas[i];
      if (!f) return '<div class="p vacia"></div>';
      return '<div class="p' + (i === 0 ? " oro" : "") + '">' +
        '<div class="m">' + (i + 1) + "º</div>" +
        escudo(f.participante, "grande") +
        '<div class="n">' + esc(nombre(f.participante)) + "</div>" +
        '<div class="v">' + valor(f) + "</div></div>";
    }).join("") + "</div>";
  }

  // -------------------------------------------------------------- resumen

  /* La frontera: quien ocupa ahora mismo los dos puestos que deciden la
     temporada, el ultimo que pasa directo a octavos y el ultimo que se salva
     de la eliminacion. */
  function fronteraHTML() {
    var lineas = [];

    function corte(puesto, etiqueta) {
      var f = D.general[puesto - 1];
      if (!f) return;
      lineas.push('<div class="fr">' +
        '<div class="fr-t">' + esc(etiqueta) + "</div>" +
        '<div class="fr-e">' + escudo(f.participante) +
        "<span>" + esc(nombre(f.participante)) + "</span>" +
        "<small>" + puesto + "º</small></div>" +
        '<div class="fr-p">' + f.puntos + "<small>pts</small></div></div>");
    }

    corte(D.reglas.corte_octavos, "Última plaza directa a octavos");
    corte(D.reglas.corte_playoff, "Corte de eliminación");
    return lineas.length
      ? '<div class="tarjeta frontera">' + lineas.join("") + "</div>" : "";
  }

  function pintaResumen() {
    if (!D.empezada) {
      return titulo("Resumen") +
        vacio("Todo listo para empezar",
          "Los " + (D.participantes || []).length + " equipos están inscritos. " +
          "La clasificación, el MVP y el cuadro de eliminatorias se irán " +
          "llenando según se dispute cada jornada.") +
        titulo("Los equipos", (D.participantes || []).length) +
        tabla([{ eti: "PT", clase: "n-pt", valor: function () { return 0; } }],
              (D.general || []).map(function (f) {
                // Antes de la primera jornada nadie tiene posición todavía.
                return Object.assign({}, f, { badge: "·", estado: "" });
              }));
    }

    var ultima = D.jornadas[D.jornadas.length - 1];
    var mvp = (D.mvp && D.mvp.tabla || []).filter(function (f) {
      return f.total > 0;
    });
    return '<p class="jornada-actual">Jornada ' + D.jornadas.length +
      " de " + D.reglas.jornadas_fase + "</p>" +

      titulo("Podio de la jornada", ultima.nombre) +
      podioHTML(ultima.filas.slice(0, 3), function (f) { return f.puntos; }) +

      titulo("Clasificación general", "cabeza de la tabla") +
      tabla(COLUMNAS_GENERAL, D.general.slice(0, 10).map(conAviso)) +
      leyenda() +
      '<p class="nota">Los 36 equipos, con todas las estadísticas, en la ' +
      'pestaña <b>General</b>.</p>' +

      (mvp.length ? titulo("MVP", "máximo 8,00") +
        podioHTML(mvp.slice(0, 3), function (f) { return f.total.toFixed(2); })
        : "") +

      titulo("La frontera", "lo que se juega cada semana") +
      fronteraHTML();
  }

  // --------------------------------------------------------------- cuadro

  function pintaCuadro() {
    if (!D.eliminatorias) {
      var faltan = Math.max(0, D.reglas.jornadas_fase - D.jornadas.length);
      return titulo("Eliminatorias") +
        vacio("El cuadro se activa tras la jornada 8",
          faltan
            ? "Faltan " + faltan + " jornadas de fase clasificatoria. " +
              "Al terminar, los ocho primeros pasan a octavos, del 9º al " +
              "24º juegan el play-off y del 25º al 36º quedan eliminados."
            : "La fase clasificatoria ha terminado. El administrador publicará " +
              "aquí el cuadro en cuanto se sorteen los emparejamientos.");
    }
    return titulo("Eliminatorias") + vacio("En construcción", "");
  }

  // ----------------------------------------------------------------- info

  /* Un bloque plegable. Se usa <details> nativo: sin JavaScript, accesible
     desde el teclado y sin que se pierda al repintar la seccion. */
  function bloque(titulo, contenido, abierto) {
    return '<details class="bloque"' + (abierto ? " open" : "") + ">" +
      "<summary>" + esc(titulo) + "</summary>" +
      '<div class="info">' + contenido + "</div></details>";
  }

  function premiosHTML() {
    var p = D.premios;
    if (!p) return "";
    var m = p.moneda || "€";

    var reparto = p.reparto.map(function (r) {
      return '<div class="pr"><span>' + esc(r.puesto) + "</span><b>" +
        r.importe + m + "</b></div>";
    }).join("");

    var gente = (p.participantes || []).map(function (id) {
      return '<div class="pg">' + escudo(id) + "<span>" +
        esc(nombre(id)) + "</span></div>";
    }).join("");

    return '<div class="bote"><span>Bote total</span><b>' + p.bote + m +
      "</b></div>" +
      '<div class="reparto">' + reparto + "</div>" +
      "<h3>Quién compite por el dinero</h3>" +
      "<p>" + (p.participantes || []).length + " de los " +
      (D.participantes || []).length + " participantes. El resto juega " +
      "la competición igual, pero fuera del bote.</p>" +
      '<div class="premiados">' + gente + "</div>";
  }

  function pintaInfo() {
    return titulo("Información", D.edicion) +
      (D.actualizado
        ? '<p class="nota">Datos actualizados el ' + esc(D.actualizado) +
          ".</p>"
        : "") +

      bloque("Premios", premiosHTML(), true) +

      bloque("Formato de la competición",
        "<p>Formato Biwenger sin mercado: gana quien mejor alineación haga " +
        "cada jornada. Somos <span class='destacado'>36 participantes</span>, " +
        "tantos como en la Champions.</p>" +
        "<h3>1. Fase clasificatoria</h3>" +
        "<p>De la jornada 1 a la 8.</p><ul>" +
        "<li>Del 1º al 8º: clasifican a octavos.</li>" +
        "<li>Del 9º al 24º: disputan el play-off.</li>" +
        "<li>Del 25º al 36º: quedan eliminados.</li></ul>" +
        "<h3>2. Fase eliminatoria</h3>" +
        "<p>Enfrentamientos directos a ida y vuelta. El emparejamiento " +
        "depende de la posición en la fase clasificatoria.</p>") +

      bloque("Normas de la liga",
        "<ol>" +
        "<li><span class='destacado'>Existe el ariete</span>: suma +3 puntos " +
        "si marca gol.</li>" +
        "<li><span class='destacado'>Existe un cambio</span> durante la " +
        "jornada.</li>" +
        "<li>No existe restricción de dinero.</li>" +
        "<li>No existe el capitán.</li>" +
        "<li>No existen suplentes.</li>" +
        "<li>No existe entrenador.</li>" +
        "<li><span class='destacado'>Expulsión por inactividad</span>: 3 " +
        "jornadas seguidas sin alinear.</li></ol>") +

      bloque("Cómo se deshacen los empates",
        "<p>En las clasificaciones, la estadística marcada en " +
        "<b class='oro'>dorado</b> es la que separa a cada participante del " +
        "siguiente.</p>" +
        "<h3>En la clasificación general</h3><ol>" +
        "<li>Más jornadas ganadas.</li><li>Mejor media de posición.</li>" +
        "<li>Más puntos de ariete.</li><li>Más goles.</li>" +
        "<li>Más asistencias.</li></ol>" +
        "<p>Si el empate se mantiene, se comparan el resto de estadísticas " +
        "del Biwenger.</p>" +
        "<h3>En una jornada</h3><ol>" +
        "<li>Más puntos de ariete.</li><li>Más goles.</li>" +
        "<li>Más asistencias.</li>" +
        "<li>Mejor posición en la general antes de la jornada.</li></ol>" +
        "<p>Si dos participantes empatan en todo, <b>comparten posición</b> y " +
        "la siguiente salta: 15º, 15º y 17º.</p>" +
        "<h3>En una eliminatoria</h3><ol>" +
        "<li>Más goles en la eliminatoria.</li>" +
        "<li>Mejor posición en la fase clasificatoria.</li></ol>") +

      bloque("El MVP",
        "<p>Aunque quedes eliminado sigues compitiendo por este premio. Se " +
        "reparte en ocho apartados; en cada uno puntúan los tres primeros con " +
        "<span class='destacado'>1,00 / 0,50 / 0,25</span>. Máximo: 8,00.</p>" +
        "<ol>" +
        "<li>Más goles conseguidos.</li><li>Más asistencias conseguidas.</li>" +
        "<li>Más puntos con ariete.</li><li>Más jornadas ganadas.</li>" +
        "<li>Campeón fase clasificatoria.</li>" +
        "<li>Más puntos conseguidos en total.</li>" +
        "<li>Mejor media de posición.</li>" +
        "<li>Más puntos en una jornada ganada.</li></ol>" +
        "<p>Empate en el MVP: gana quien siga vivo en la competición y, si " +
        "los dos siguen o los dos están fuera, quien mejor posición tenga en " +
        "la general.</p>") +

      bloque("Qué significa cada columna",
        "<ul>" +
        "<li><b>PT</b> puntos totales · <b>PTS</b> puntos de la jornada.</li>" +
        "<li><b>JG</b> jornadas ganadas.</li>" +
        "<li><b>MED</b> media de posición por jornada; cuanto menor, mejor.</li>" +
        "<li><b>ARI</b> puntos de ariete acumulados, a +3 por jornada " +
        "acertada.</li>" +
        "<li><b>GF</b> goles · <b>AS</b> asistencias.</li>" +
        "<li><b>+/−</b> puestos ganados o perdidos en la última jornada.</li>" +
        "</ul>");
  }

  // ------------------------------------------------------------- armazón

  var PINTORES = {
    resumen: pintaResumen, general: pintaGeneral, jornada: pintaJornada,
    mvp: pintaMVP, cuadro: pintaCuadro, info: pintaInfo
  };

  var actual = "resumen";
  var vista = document.getElementById("vista");

  function pintarNav() {
    document.getElementById("nav").innerHTML = SECCIONES.map(function (s) {
      return '<button data-seccion="' + s.id + '" aria-current="' +
        (s.id === actual) + '"><svg viewBox="0 0 24 24"><path d="' +
        s.icono + '"/></svg>' + s.eti + "</button>";
    }).join("");
  }

  function pintar() {
    pintarNav();
    vista.innerHTML = (PINTORES[actual] || pintaResumen)();
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  document.addEventListener("click", function (ev) {
    var nav = ev.target.closest("[data-seccion]");
    if (nav) { actual = nav.dataset.seccion; location.hash = actual; pintar(); return; }

    var jor = ev.target.closest("[data-jornada]");
    if (jor) { jornadaVista = Number(jor.dataset.jornada); pintar(); }
  });

  window.addEventListener("hashchange", function () {
    var h = location.hash.slice(1);
    if (PINTORES[h] && h !== actual) { actual = h; pintar(); }
  });

  // -------------------------------------------------------------- arranque

  if (D.logo) {
    var img = document.getElementById("marca-logo");
    img.src = D.logo;
    img.hidden = false;
  }
  document.getElementById("marca-nombre").textContent = D.nombre || "Champions Lula";
  document.getElementById("pie-txt").textContent =
    (D.nombre || "") + " · " + (D.edicion || "");

  if (D.demo) {
    document.querySelector(".cabecera").insertAdjacentHTML("beforeend",
      '<p class="aviso-demo">Datos de ejemplo para probar el diseño. ' +
      "Ningún resultado es real.</p>");
  }

  if (PINTORES[location.hash.slice(1)]) actual = location.hash.slice(1);
  pintar();
})();
