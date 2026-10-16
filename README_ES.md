<p align="center"><a href="README.md">简体中文</a> · <a href="README_EN.md">English</a> · <a href="README_JA.md">日本語</a> · <a href="README_KO.md">한국어</a> · <a href="README_ES.md">Español</a></p>

<div align="center">

# xhs-account-diagnosis

**Dale el enlace de un perfil de Xiaohongshu (RedNote) y obtén en PDF un diagnóstico de unas 30 páginas con un plan de crecimiento a 90 días**

Funciona con cualquier agente de IA de línea de comandos que pueda leer archivos y ejecutar comandos: Claude Code, Codex CLI, Gemini CLI

[Informes de ejemplo](https://xhs.addsum.top/samples) · [Hecho por Addsum](https://addsum.top/)

</div>

---

No es otro panel de métricas. Responde a lo que de verdad se pregunta quien lleva una cuenta:

> ¿Dónde se atasca mi cuenta? ¿Qué arreglo primero y qué después? ¿Qué hago cada semana durante los próximos 90 días?

Recoge el perfil y las 30 notas más recientes (texto, me gusta, guardados, comentarios, todas las portadas e imágenes interiores), aplica un diagnóstico de "puntos de ruptura en un embudo de seis etapas" para encontrar la etapa que más pierde, propone las correcciones en un orden fijo y lo maqueta todo en un PDF que puedes entregar a un cliente.

El informe está escrito en chino, porque Xiaohongshu es una plataforma en chino.

## Qué incluye el informe

Diez partes, entre 15.000 y 25.000 caracteres chinos:

1. Resumen ejecutivo: veredicto, problemas principales, correcciones prioritarias y una previsión prudente a 90 días
2. Situación actual: datos básicos, repaso de las líneas de contenido, una evaluación de salud en nueve dimensiones y perfiles de audiencia
3. Diagnóstico de las seis etapas: impresión a clic, clic a seguimiento, seguimiento a mensaje privado, mensaje a conversión, conversión a recompra. Cada etapa incluye situación, problema, causas y correcciones
4. Nicho y competencia: panorama, análisis de referentes y oportunidades de diferenciación (si el agente tiene acceso a la web, también investiga las normas de la plataforma y las tendencias del nicho)
5. Posicionamiento: fórmula de posicionamiento, opciones de nombre y biografía, personaje y guía visual
6. Estrategia de contenido: mezcla de contenidos, banco de temas, calendario día a día de 30 días y un procedimiento de producción
7. Monetización: niveles de producto, ruta de conversión, guiones para mensajes privados y principios de precios
8. Plan de 90 días: tres fases con listas de acciones y criterios de control, más una tabla de hitos
9. Riesgos: de plataforma, operativos y de actitud, con cuatro listas de contingencia
10. Anexo: hojas de seguimiento, herramientas, un banco de títulos y preguntas frecuentes

En la [página de ejemplos](https://xhs.addsum.top/samples) hay extractos de tres cuentas reales (misma metodología).

## Metodología

- **Primero, el punto de ruptura.** En lugar de enumerar todos los defectos, busca la etapa del embudo que más pierde y concentra ahí el esfuerzo.
- **Las correcciones tienen un orden.** Posicionamiento → producto convertido en contenido → conversión desde el perfil → coherencia visual → búsqueda → pruebas de monetización. Pulir portadas o comprar alcance antes de que el perfil convierta solo desperdicia el tráfico.
- **Cada problema tiene cuatro partes.** Síntoma, causa, impacto y corrección. Si falta alguna, es una queja, no un diagnóstico.
- **Solo datos visibles.** Cada cifra del informe sale de una tabla de hechos que generan los scripts. Las impresiones internas, las visitas al perfil, los mensajes y las conversiones no están disponibles; el informe lo dice, y toda previsión es un rango prudente.
- **Sin resultados garantizados.** El informe dice claramente que no puede prometer seguidores ni ingresos y enumera lo que sí está bajo tu control en 90 días.

Las reglas completas están en [`RUN.md`](RUN.md) y el esqueleto del informe en [`references/report-template.md`](references/report-template.md).

## Requisitos

1. Un ordenador (Mac, Windows o Linux) con Chrome
2. Haber iniciado sesión en la web de Xiaohongshu (xiaohongshu.com) en tu Chrome de siempre
3. Node.js 22 o superior (compruébalo con `node -v`)
4. Cualquier agente de IA de línea de comandos: Claude Code, Codex CLI, Gemini CLI, etc.

No hace falta clave de API ni otras dependencias.

## Instalación

Claude Code:

```bash
git clone https://github.com/ai-martin-lau/xhs-account-diagnosis ~/.claude/skills/xhs-account-diagnosis
```

Otros agentes: clónalo donde quieras y anota la ruta.

```bash
git clone https://github.com/ai-martin-lau/xhs-account-diagnosis
```

## Uso

Primero consigue el enlace del perfil: en la app de Xiaohongshu, abre el perfil, toca compartir y elige "Copiar enlace"; o abre el perfil en un navegador de escritorio y copia la dirección, con la forma `https://www.xiaohongshu.com/user/profile/xxxx`.

En Claude Code, escribe:

```text
诊断这个小红书账号 https://www.xiaohongshu.com/user/profile/xxxx
```

En Codex CLI, Gemini CLI u otro agente, escribe:

```text
Lee <ruta del clon>/RUN.md y síguelo al pie de la letra. Cuenta objetivo: https://www.xiaohongshu.com/user/profile/xxxx
```

Después solo hay que esperar. La recogida de datos tarda unos 5 minutos y la redacción del informe entre 10 y 20, sin que tengas que intervenir.

## Qué obtienes

Una carpeta `账号诊断/<nombre de la cuenta>/` en el directorio de trabajo actual:

- `<nombre de la cuenta>_小红书账号诊断报告与优化方案.pdf`: el PDF para entregar
- El `.md` con el mismo nombre: la fuente editable
- `证据/` (evidencias): captura del perfil, todas las portadas e imágenes interiores, los datos en bruto `data.json` y la tabla de hechos

## Avisos que puedes ver

- **Chrome pide "Permitir la depuración remota"**: pulsa Permitir. El script se conecta a tu Chrome para navegar con tu sesión iniciada.
- **"Cierra Chrome por completo y vuelve a intentarlo"**: pulsa Cmd+Q en Mac o cierra todas las ventanas de Chrome en Windows y repite la misma frase. Chrome se vuelve a abrir solo.
- **Aparece un muro de inicio de sesión**: inicia sesión una vez en la web de Xiaohongshu en Chrome y deja que continúe.
- **Parece lento**: el ritmo es lento a propósito para parecer una navegación normal.

## Preguntas frecuentes

**¿Hará algo con mi cuenta de Xiaohongshu?**
No. Solo lee: no da me gusta, no sigue, no comenta ni envía mensajes. Navega por perfiles públicos como lo haría una persona. El ritmo está limitado, pero cualquier acceso automatizado tiene una pequeña probabilidad de activar los controles de riesgo de la plataforma. Si eso te preocupa, no lo uses.

**¿Puedo diagnosticar la cuenta de otra persona?**
Sí, siempre que el perfil sea público. Úsalo solo con tus propias cuentas o con cuentas de clientes que te hayan dado permiso.

**¿El informe garantiza crecimiento?**
No, y el propio informe lo dice. Te da el punto de ruptura, el orden de las correcciones y un plan de 90 días. El resultado depende de la ejecución.

**¿Cuántas cuentas a la vez?**
Una cada vez. Cuando termine, envíale el siguiente enlace.

## Archivos

```text
RUN.md                       El manual de ejecución (fuente única para cualquier CLI)
SKILL.md / AGENTS.md / GEMINI.md   Puntos de entrada para Claude Code / Codex / Gemini, todos apuntan a RUN.md
references/report-template.md      El esqueleto del informe en diez partes
scripts/xhs_fetch.mjs        Se conecta a tu Chrome local y recoge el perfil y las notas
scripts/facts.mjs            Genera la tabla de hechos y las estadísticas por línea de contenido
scripts/build_pdf.mjs        Convierte el Markdown en un PDF con calidad de imprenta (Chrome sin interfaz)
```

## Aviso legal

El informe es asesoramiento operativo, no una promesa de resultados. Respeta las normas de Xiaohongshu y no lo uses para acosar, plagiar ni nada que las incumpla. Eres responsable del uso que hagas de él.

## Licencia

[MIT](LICENSE)

Hecho por [Addsum](https://addsum.top/). Más código abierto nuestro: [slide-maker](https://github.com/addsumtech/slides_maker) (PowerPoint editable generado con IA) y [x-account-teardown](https://github.com/ai-martin-lau/x-account-teardown) (reconstruye cómo creció cualquier cuenta de X).

## Historial de estrellas

[![Star History Chart](https://api.star-history.com/svg?repos=ai-martin-lau/xhs-account-diagnosis&type=Date)](https://star-history.com/#ai-martin-lau/xhs-account-diagnosis&Date)
