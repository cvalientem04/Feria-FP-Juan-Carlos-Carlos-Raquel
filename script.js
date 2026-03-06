/* =============================================
   SCRIPT.JS — Constructor Visual Java + Registro
   ============================================= */

let segundosGuardados = 0; // Variable global: segundos del último intento

const CATALOGO_ALGORITMOS = [
    { id: 1, dificultad: "fácil",  factor: 1,    enunciado: "Definir un String y mostrar 'Hola Mundo'." },
    { id: 2, dificultad: "fácil",  factor: 1,    enunciado: "Definir una variable entera, asignarle 3 y mostrarla." },
    { id: 3, dificultad: "fácil",  factor: 1,    enunciado: "Calcular la suma de 3 + 5 y mostrar resultado." },
    { id: 4, dificultad: "medio",  factor: 0.66, enunciado: "Bucle for para imprimir 'Hola.' 5 veces." },
    { id: 5, dificultad: "medio",  factor: 0.66, enunciado: "Bucle while para contar e imprimir del 1 al 10." },
    { id: 6, dificultad: "medio",  factor: 0.66, enunciado: "Condicional para verificar si número > 10 y sumatorio 1-10." },
    { id: 7, dificultad: "difícil", factor: 0.33, enunciado: "Algoritmo de ordenación o lógica compleja." },
    { id: 8, dificultad: "difícil", factor: 0.33, enunciado: "Contar cuántos números > 5 entre los 10 primeros naturales." },
    { id: 9, dificultad: "difícil", factor: 0.33, enunciado: "Condicional para determinar si una persona es mayor de edad." }
];

document.addEventListener('DOMContentLoaded', () => {

    // ─── Detectar página actual ───
    const isConstructor = !!document.getElementById('palette');
    const isRegistro    = !!document.getElementById('playerForm');
    const isCampeones   = !!document.getElementById('podio');

    if (isConstructor) initConstructor();
    if (isRegistro)    initRegistro();
    if (isCampeones)   initCampeones();
});

/* =============================================
   1. CONSTRUCTOR VISUAL JAVA
   ============================================= */
function initConstructor() {

    const palette   = document.getElementById('palette');
    const dropZone  = document.getElementById('dropZone');
    const genBtn    = document.getElementById('generateBtn');
    const runBtn    = document.getElementById('runBtn');
    const clearBtn  = document.getElementById('clearBtn');
    const outputEl  = document.getElementById('outputCode');
    const execEl    = document.getElementById('executionResult');

    // ─── Panel de ejercicios ───
    const ejerciciosList  = document.getElementById('ejerciciosList');
    const ejercicioDetail = document.getElementById('ejercicioDetail');
    const ejercicioContent = document.getElementById('ejercicioContent');
    const ejercicioBackBtn = document.getElementById('ejercicioBackBtn');

    if (ejerciciosList) initEjercicios();

    let draggedBlock   = null;   // elemento que se arrastra
    let dragSource     = null;   // 'palette' | 'workspace'
    let dropIndicator  = null;   // línea indicadora de posición

    // ─── Contador de bloques en el navbar ───
    const navbar = document.querySelector('.navbar');
    const counter = document.createElement('span');
    counter.className = 'contador';
    counter.textContent = '🧱 0';
    navbar.appendChild(counter);

    function updateCounter() {
        const n = dropZone.querySelectorAll('.workspace-block').length;
        counter.textContent = '🧱 ' + n;
        counter.classList.remove('pulse');
        void counter.offsetWidth;          // forzar reflow
        counter.classList.add('pulse');
    }

    // ─── Cargar bloques desde block.json ───
    fetch('block.json')
        .then(r => r.json())
        .then(data => renderPalette(data.categories))
        .catch(() => palette.innerHTML += '<p style="color:red">Error cargando bloques</p>');

    function renderPalette(categories) {
        categories.forEach(cat => {
            const section = document.createElement('div');
            section.className = 'category ' + cat.cssClass;

            const title = document.createElement('h3');
            title.textContent = cat.icon + ' ' + cat.name;
            section.appendChild(title);

            cat.blocks.forEach(b => {
                const blockCss = b.cssClass || cat.cssClass;
                const block = document.createElement('div');
                block.className = 'block cat-' + blockCss;
                block.textContent = b.display || b.code;
                block.draggable = true;
                block.dataset.code     = b.code;
                block.dataset.display  = b.display || b.code;
                block.dataset.category = blockCss;
                if (b.type) block.dataset.type = b.type;

                // Drag desde paleta
                block.addEventListener('dragstart', e => {
                    draggedBlock = block;
                    dragSource   = 'palette';
                    block.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'copy';
                    e.dataTransfer.setData('text/plain', b.code);
                });
                block.addEventListener('dragend', () => {
                    block.classList.remove('dragging');
                    draggedBlock = null;
                    dragSource   = null;
                    removeIndicator();
                });

                section.appendChild(block);
            });

            palette.appendChild(section);
        });
    }

    // ─── Drop zone eventos ───
    dropZone.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = dragSource === 'palette' ? 'copy' : 'move';
        dropZone.classList.add('drag-over');
        showDropIndicator(e);
    });

    dropZone.addEventListener('dragleave', e => {
        if (!dropZone.contains(e.relatedTarget)) {
            dropZone.classList.remove('drag-over');
            removeIndicator();
        }
    });

    dropZone.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');

        const insertBefore = getInsertPosition(e);

        if (dragSource === 'palette' && draggedBlock) {
            const wsBlock = createWorkspaceBlock(
                draggedBlock.dataset.code,
                draggedBlock.dataset.category,
                draggedBlock.dataset.display
            );
            if (insertBefore) {
                dropZone.insertBefore(wsBlock, insertBefore);
            } else {
                dropZone.appendChild(wsBlock);
            }
        } else if (dragSource === 'workspace' && draggedBlock) {
            if (insertBefore && insertBefore !== draggedBlock) {
                dropZone.insertBefore(draggedBlock, insertBefore);
            } else if (!insertBefore) {
                dropZone.appendChild(draggedBlock);
            }
        }

        removeIndicator();
        updateCounter();
    });

    // ─── Indicador de posición (línea azul) ───
    function showDropIndicator(e) {
        removeIndicator();
        const blocks = [...dropZone.querySelectorAll('.workspace-block:not(.dragging)')];
        let ref = null;

        for (const b of blocks) {
            const rect = b.getBoundingClientRect();
            if (e.clientY < rect.top + rect.height / 2) {
                ref = b;
                break;
            }
        }

        dropIndicator = document.createElement('div');
        dropIndicator.className = 'drop-indicator';

        if (ref) {
            dropZone.insertBefore(dropIndicator, ref);
        } else {
            dropZone.appendChild(dropIndicator);
        }
    }

    function removeIndicator() {
        if (dropIndicator && dropIndicator.parentNode) {
            dropIndicator.parentNode.removeChild(dropIndicator);
        }
        dropIndicator = null;
    }

    function getInsertPosition(e) {
        const blocks = [...dropZone.querySelectorAll('.workspace-block:not(.dragging)')];
        for (const b of blocks) {
            const rect = b.getBoundingClientRect();
            if (e.clientY < rect.top + rect.height / 2) return b;
        }
        return null;
    }

    // ─── Crear bloque en zona de trabajo ───
    function createWorkspaceBlock(code, category, display) {
        const div = document.createElement('div');
        div.className = 'workspace-block cat-' + category;
        div.draggable = true;
        div.dataset.code     = code;
        div.dataset.display  = display || code;
        div.dataset.category = category;

        const span = document.createElement('span');
        span.className = 'code-text';
        span.textContent = display || code;
        div.appendChild(span);

        // Botón de sangría (indent)
        let indentLevel = 0;
        const indentBtn = document.createElement('button');
        indentBtn.className = 'indent-btn';
        indentBtn.textContent = '→';
        indentBtn.title = 'Añadir sangría';
        indentBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            indentLevel++;
            if (indentLevel > 3) indentLevel = 0;
            div.dataset.indent = indentLevel;
            div.style.marginLeft = (indentLevel * 30) + 'px';
            div.style.width = indentLevel > 0 ? 'calc(100% - ' + (indentLevel * 30) + 'px)' : '';
        });
        div.appendChild(indentBtn);

        const btn = document.createElement('button');
        btn.className = 'delete-btn';
        btn.textContent = '✕';
        btn.addEventListener('click', () => {
            div.remove();
            updateCounter();
        });
        div.appendChild(btn);

        // Drag dentro del workspace para reordenar
        div.addEventListener('dragstart', e => {
            draggedBlock = div;
            dragSource   = 'workspace';
            div.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', code);
        });
        div.addEventListener('dragend', () => {
            div.classList.remove('dragging');
            draggedBlock = null;
            dragSource   = null;
            removeIndicator();
        });

        return div;
    }

    // ─── Generar código Java ───
    genBtn.addEventListener('click', () => {
        const blocks = dropZone.querySelectorAll('.workspace-block');
        if (blocks.length === 0) {
            outputEl.textContent = '// No hay bloques en la zona de trabajo';
            outputEl.classList.add('visible');
            return;
        }

        let lines = [];
        blocks.forEach(b => lines.push(b.dataset.code));

        const javaCode = buildJavaCode(lines);
        outputEl.textContent = javaCode;
        outputEl.classList.add('visible');
        execEl.classList.remove('visible');
    });

    function buildJavaCode(lines) {
        let code = 'public class Programa {\n';
        code    += '    public static void main(String[] args) {\n';

        let indent = 2; // nivel de indentación (cada nivel = 4 espacios)
        let indentNextOnly = false; // para if/else sin llaves

        lines.forEach(line => {
            const trimmed = line.trim();

            // Si la línea anterior era if/else sin llaves, esta línea es el cuerpo
            if (indentNextOnly) {
                // Si es un else, va al mismo nivel que el if (reducir primero)
                if (trimmed === 'else') {
                    indent = Math.max(2, indent - 1);
                    code += '    '.repeat(indent) + trimmed + '\n';
                    // El else también indenta la siguiente línea
                    indent++;
                    return;
                }
                // Línea normal: imprimir indentada y volver al nivel anterior
                code += '    '.repeat(indent) + trimmed + '\n';
                indent = Math.max(2, indent - 1);
                indentNextOnly = false;
                return;
            }

            // Si la línea cierra bloque (}, }while, } else)
            if (trimmed === '}' || trimmed.startsWith('} ') || trimmed.startsWith('}while')) {
                indent = Math.max(2, indent - 1);
            }

            code += '    '.repeat(indent) + trimmed + '\n';

            // Si la línea abre bloque { }, ajustar indent
            if (trimmed.endsWith('{ }') || trimmed.endsWith('{}')) {
                // bloque vacío → no cambiar indent
            } else if (trimmed.endsWith('{')) {
                indent++;
            }
            // if/else sin llaves → indentar solo la siguiente línea
            else if (trimmed.match(/^if\s*\(.+\)\s*$/) || trimmed === 'else') {
                indent++;
                indentNextOnly = true;
            }
        });

        code += '    }\n';
        code += '}\n';
        return code;
    }

    // ─── Ejecutar (simular) código ───
    runBtn.addEventListener('click', () => {
        const blocks = dropZone.querySelectorAll('.workspace-block');
        if (blocks.length === 0) return;

        let lines = [];
        blocks.forEach(b => lines.push(b.dataset.code));

        // Primero generar el código
        const javaCode = buildJavaCode(lines);
        outputEl.textContent = javaCode;
        outputEl.classList.add('visible');

        // Simular ejecución
        const result = simulateExecution(lines);
        renderExecutionResult(result);
    });

    function simulateExecution(lines) {
        const vars = {};
        const errors = [];
        const output = [];

        // ─── Buscar llave de cierre correspondiente ───
        function findClose(startIdx, maxIdx) {
            let depth = 0;
            for (let j = startIdx; j <= maxIdx; j++) {
                const l = lines[j].trim();
                for (const ch of l) {
                    if (ch === '{') depth++;
                    if (ch === '}') depth--;
                }
                if (depth === 0 && j > startIdx) return j;
            }
            return maxIdx;
        }

        // ─── Buscar } else { dentro de un bloque if ───
        function findElseInBlock(ifOpen, ifClose) {
            let depth = 0;
            for (let j = ifOpen + 1; j < ifClose; j++) {
                const l = lines[j].trim();
                if (l === '} else {' && depth === 0) return j;
                for (const ch of l) {
                    if (ch === '{') depth++;
                    if (ch === '}') depth--;
                }
            }
            return -1;
        }

        // ─── Ejecutar bloque de líneas recursivamente ───
        function run(start, end) {
            let idx = start;
            while (idx <= end) {
                const line = lines[idx].trim();
                if (!line || line === '{' || line === '}') { idx++; continue; }

                try {
                    // do-while loop
                    let m = line.match(/^do\s*\{$/);
                    if (m) {
                        const closeIdx = findClose(idx, end);
                        const closeLine = lines[closeIdx].trim();
                        const whileMatch = closeLine.match(/\}while\s*\((.+)\)\s*;?$/);

                        if (whileMatch) {
                            let safety = 0;
                            do {
                                run(idx + 1, closeIdx - 1);
                                safety++;
                            } while (evalBoolExpr(whileMatch[1], vars) && safety < 1000);
                        }
                        idx = closeIdx + 1;
                        continue;
                    }

                    // for loop
                    m = line.match(/^for\s*\((.+)\)\s*\{$/);
                    if (m) {
                        const closeIdx = findClose(idx, end);
                        const parts = m[1].split(';').map(s => s.trim());
                        if (parts.length === 3) {
                            executeSingleLine(parts[0] + ';');
                            let safety = 0;
                            while (evalBoolExpr(parts[1], vars) && safety < 1000) {
                                run(idx + 1, closeIdx - 1);
                                executeSingleLine(parts[2] + ';');
                                safety++;
                            }
                        }
                        idx = closeIdx + 1;
                        continue;
                    }

                    // while loop
                    m = line.match(/^while\s*\((.+)\)\s*\{$/);
                    if (m) {
                        const closeIdx = findClose(idx, end);
                        let safety = 0;
                        while (evalBoolExpr(m[1], vars) && safety < 1000) {
                            run(idx + 1, closeIdx - 1);
                            safety++;
                        }
                        idx = closeIdx + 1;
                        continue;
                    }

                    // if / else CON llaves
                    m = line.match(/^if\s*\((.+)\)\s*\{$/);
                    if (m) {
                        const closeIdx = findClose(idx, end);
                        const elseIdx  = findElseInBlock(idx, closeIdx);

                        if (evalBoolExpr(m[1], vars)) {
                            run(idx + 1, elseIdx >= 0 ? elseIdx - 1 : closeIdx - 1);
                        } else if (elseIdx >= 0) {
                            run(elseIdx + 1, closeIdx - 1);
                        }
                        idx = closeIdx + 1;
                        continue;
                    }

                    // if SIN llaves (una sola instrucción)
                    m = line.match(/^if\s*\((.+)\)\s*$/);
                    if (m) {
                        const condition = evalBoolExpr(m[1], vars);
                        const bodyIdx = idx + 1;

                        if (bodyIdx <= end) {
                            if (condition) {
                                executeSingleLine(lines[bodyIdx].trim());
                            }
                            idx = bodyIdx + 1;

                            // Comprobar si hay else después
                            if (idx <= end && lines[idx].trim() === 'else') {
                                const elseBodyIdx = idx + 1;
                                if (elseBodyIdx <= end) {
                                    if (!condition) {
                                        executeSingleLine(lines[elseBodyIdx].trim());
                                    }
                                    idx = elseBodyIdx + 1;
                                } else {
                                    idx++;
                                }
                            }
                        } else {
                            idx++;
                        }
                        continue;
                    }

                    // else suelto (ya procesado desde el if, saltar)
                    if (line === 'else') { idx += 2; continue; }

                    // } else { — se maneja desde el if con llaves, saltar
                    if (line === '} else {') { idx++; continue; }

                    // }while(...) — se maneja desde el do, saltar
                    if (line.startsWith('}while')) { idx++; continue; }

                    // Línea normal
                    executeSingleLine(line);
                } catch (err) {
                    errors.push({ line: idx + 1, code: line, message: err.message });
                }
                idx++;
            }
        }

        // ─── Ejecutar una línea individual ───
        function executeSingleLine(line) {
            if (line === '{' || line === '}' || line === '{ }' || line === '{}') return;
            let stmt = line.replace(/;$/, '').trim();
            let m;

            // System.out.println(...)
            m = stmt.match(/^System\.out\.println\((.+)\)$/);
            if (m) { output.push(evalPrintArg(m[1])); return; }

            // System.out.print(...)
            m = stmt.match(/^System\.out\.print\((.+)\)$/);
            if (m) { output.push(evalPrintArg(m[1])); return; }

            // int (declaración simple o múltiple): int a = 12, suma = 0;
            m = stmt.match(/^int\s+(.+)$/);
            if (m) {
                const decls = m[1].split(',').map(s => s.trim());
                decls.forEach(d => {
                    const dm = d.match(/^(\w+)\s*=\s*(.+)$/);
                    if (dm) {
                        vars[dm[1]] = { type: 'int', value: Math.floor(evalExpr(dm[2], vars)) };
                    } else {
                        const nm = d.match(/^(\w+)$/);
                        if (nm) vars[nm[1]] = { type: 'int', value: 0 };
                    }
                });
                return;
            }

            // double x = expr;
            m = stmt.match(/^double\s+(\w+)\s*=\s*(.+)$/);
            if (m) { vars[m[1]] = { type: 'double', value: evalExpr(m[2], vars) }; return; }

            // boolean x = expr;
            m = stmt.match(/^boolean\s+(\w+)\s*=\s*(.+)$/);
            if (m) { vars[m[1]] = { type: 'boolean', value: evalBoolExpr(m[2], vars) }; return; }

            // String x = "...";
            m = stmt.match(/^String\s+(\w+)\s*=\s*"([^"]*)"$/);
            if (m) { vars[m[1]] = { type: 'String', value: m[2] }; return; }

            // String x;  (sin valor)
            m = stmt.match(/^String\s+(\w+)$/);
            if (m) { vars[m[1]] = { type: 'String', value: '' }; return; }

            // x++
            m = stmt.match(/^(\w+)\+\+$/);
            if (m) { if (vars[m[1]]) vars[m[1]].value++; return; }

            // x--
            m = stmt.match(/^(\w+)--$/);
            if (m) { if (vars[m[1]]) vars[m[1]].value--; return; }

            // Asignación: x = expr
            m = stmt.match(/^(\w+)\s*=\s*(.+)$/);
            if (m) {
                const name = m[1];
                const expr = m[2].trim();

                // String
                const strMatch = expr.match(/^"([^"]*)"$/);
                if (strMatch) {
                    if (vars[name]) vars[name].value = strMatch[1];
                    else vars[name] = { type: 'String', value: strMatch[1] };
                    return;
                }

                // Ternario
                const ternary = expr.match(/^\((.+)\)\s*\?\s*(.+)\s*:\s*(.+)$/);
                if (ternary) {
                    const cond = evalBoolExpr(ternary[1], vars);
                    const val  = cond ? evalExpr(ternary[2], vars) : evalExpr(ternary[3], vars);
                    const t = vars[name] ? vars[name].type : 'int';
                    vars[name] = { type: t, value: t === 'int' ? Math.floor(val) : val };
                    return;
                }

                // Boolean
                if (expr.includes('&&') || expr.includes('||') || expr.includes('.equals(') ||
                    expr === 'true' || expr === 'false') {
                    vars[name] = { type: 'boolean', value: evalBoolExpr(expr, vars) };
                    return;
                }

                // Numérica
                const v = evalExpr(expr, vars);
                const t = vars[name] ? vars[name].type : (Number.isInteger(v) ? 'int' : 'double');
                vars[name] = { type: t, value: t === 'int' ? Math.floor(v) : v };
                return;
            }
        }

        // ─── Evaluar argumento de println/print ───
        function evalPrintArg(arg) {
            const parts = [];
            let current = '';
            let inStr = false;
            for (let c = 0; c < arg.length; c++) {
                if (arg[c] === '"') { inStr = !inStr; current += arg[c]; }
                else if (arg[c] === '+' && !inStr) { parts.push(current.trim()); current = ''; }
                else { current += arg[c]; }
            }
            parts.push(current.trim());
            return parts.map(p => {
                if (p.startsWith('"') && p.endsWith('"')) return p.slice(1, -1);
                if (vars[p]) return String(vars[p].value);
                try { return String(evalExpr(p, vars)); } catch { return p; }
            }).join('');
        }

        run(0, lines.length - 1);
        return { vars, errors, output };
    }

    function evalExpr(expr, vars) {
        let e = expr.trim();
        // Reemplazar variables por sus valores
        const sorted = Object.keys(vars).sort((a, b) => b.length - a.length);
        sorted.forEach(v => {
            if (vars[v].type !== 'boolean' && vars[v].type !== 'String') {
                e = e.replace(new RegExp('\\b' + v + '\\b', 'g'), vars[v].value);
            }
        });
        try {
            const result = Function('"use strict"; return (' + e + ')')();
            return typeof result === 'number' ? result : 0;
        } catch {
            return 0;
        }
    }

    function evalBoolExpr(expr, vars) {
        let e = expr.trim();

        // Quitar paréntesis exteriores si los hay
        if (e.startsWith('(') && e.endsWith(')')) {
            let depth = 0;
            let allWrapped = true;
            for (let i = 0; i < e.length; i++) {
                if (e[i] === '(') depth++;
                if (e[i] === ')') depth--;
                if (depth === 0 && i < e.length - 1) { allWrapped = false; break; }
            }
            if (allWrapped) e = e.slice(1, -1).trim();
        }

        if (e === 'true') return true;
        if (e === 'false') return false;

        // .equals()
        const eqMatch = e.match(/(\w+)\.equals\("([^"]*)"\)/);
        if (eqMatch) {
            const v = vars[eqMatch[1]];
            const result = v && v.value === eqMatch[2];
            // Manejar || y &&
            if (e.includes('||')) {
                const parts = e.split('||').map(p => evalBoolExpr(p.trim(), vars));
                return parts.some(Boolean);
            }
            return result;
        }

        // && y ||
        if (e.includes('&&')) {
            const parts = splitLogical(e, '&&');
            return parts.every(p => evalBoolExpr(p, vars));
        }
        if (e.includes('||')) {
            const parts = splitLogical(e, '||');
            return parts.some(p => evalBoolExpr(p, vars));
        }

        // Comparaciones simples
        const cmpMatch = e.match(/(.+?)\s*(>=|<=|!=|==|>|<)\s*(.+)/);
        if (cmpMatch) {
            const left  = evalExpr(cmpMatch[1], vars);
            const right = evalExpr(cmpMatch[3], vars);
            switch (cmpMatch[2]) {
                case '>':  return left > right;
                case '<':  return left < right;
                case '>=': return left >= right;
                case '<=': return left <= right;
                case '==': return left === right;
                case '!=': return left !== right;
            }
        }

        // Variable booleana directa
        if (vars[e] && vars[e].type === 'boolean') return vars[e].value;

        // Evaluación numérica > 0
        const val = evalExpr(e, vars);
        return val > 0;
    }

    function splitLogical(expr, op) {
        const parts = [];
        let depth = 0, start = 0;
        for (let i = 0; i < expr.length; i++) {
            if (expr[i] === '(') depth++;
            if (expr[i] === ')') depth--;
            if (depth === 0 && expr.substr(i, op.length) === op) {
                parts.push(expr.substring(start, i).trim());
                i += op.length - 1;
                start = i + 1;
            }
        }
        parts.push(expr.substring(start).trim());
        return parts;
    }

    function renderExecutionResult(result) {
        execEl.innerHTML = '';
        execEl.classList.add('visible');

        const h = document.createElement('h3');
        h.textContent = '📊 Resultado de la ejecución';
        execEl.appendChild(h);

        if (result.errors.length > 0) {
            result.errors.forEach(err => {
                const div = document.createElement('div');
                div.className = 'var-line';
                div.innerHTML = `<span class="var-name" style="color:#ef4444">⚠ Línea ${err.line}:</span>
                    <span class="var-value" style="color:#fbbf24">${err.message}</span>`;
                execEl.appendChild(div);
            });
        }

        // ─── Salida por consola ───
        if (result.output && result.output.length > 0) {
            const outH = document.createElement('h4');
            outH.textContent = '💬 Salida por consola:';
            outH.style.marginTop = '10px';
            execEl.appendChild(outH);

            const outDiv = document.createElement('div');
            outDiv.style.background = '#1e293b';
            outDiv.style.padding = '10px';
            outDiv.style.borderRadius = '6px';
            outDiv.style.fontFamily = 'monospace';
            outDiv.style.color = '#22c55e';
            outDiv.style.marginBottom = '10px';
            result.output.forEach(line => {
                const p = document.createElement('div');
                p.textContent = '> ' + line;
                outDiv.appendChild(p);
            });
            execEl.appendChild(outDiv);
        }

        // ─── Variables ───
        const varKeys = Object.keys(result.vars);
        if (varKeys.length > 0) {
            const varH = document.createElement('h4');
            varH.textContent = '📦 Variables:';
            varH.style.marginTop = '10px';
            execEl.appendChild(varH);
        }

        if (varKeys.length === 0 && (!result.output || result.output.length === 0)) {
            const p = document.createElement('p');
            p.style.color = '#94a3b8';
            p.textContent = 'No se declararon variables.';
            execEl.appendChild(p);
            return;
        }

        varKeys.forEach(name => {
            const v = result.vars[name];
            const div = document.createElement('div');
            div.className = 'var-line';

            let displayValue = v.value;
            if (v.type === 'String') displayValue = '"' + v.value + '"';
            if (v.type === 'double') displayValue = parseFloat(displayValue.toFixed(4));

            div.innerHTML = `<span class="var-name">${name}</span>
                <span><span class="var-value">${displayValue}</span>
                <span class="var-type">(${v.type})</span></span>`;
            execEl.appendChild(div);
        });
    }

    // ─── Limpiar todo ───
    clearBtn.addEventListener('click', () => {
        dropZone.innerHTML = '';
        outputEl.textContent = '';
        outputEl.classList.remove('visible');
        execEl.innerHTML = '';
        execEl.classList.remove('visible');
        updateCounter();
    });

    // ─── Panel de Ejercicios ───
    function initEjercicios() {

        const EJERCICIOS_DETALLE = {
            1: {
                titulo: "Ejercicio 1 — Hola Mundo",
                descripcion: "Define una variable de tipo String, asígnale el valor \"Hola Mundo\" y muéstrala por consola.",
                bloques: [
                    { texto: "String texto", cat: "variables" },
                    { texto: "texto = \"Hola mundo\"", cat: "operations" },
                    { texto: "println(texto)", cat: "logical" }
                ]
            },
            2: {
                titulo: "Ejercicio 2 — Variable entera",
                descripcion: "Declara una variable entera, asígnale el valor 3 y muéstrala por consola.",
                bloques: [
                    { texto: "int numero", cat: "variables" },
                    { texto: "numero = 3", cat: "operations" },
                    { texto: "println(numero)", cat: "logical" }
                ]
            },
            3: {
                titulo: "Ejercicio 3 — Suma",
                descripcion: "Declara una variable 'resultado', calcula la suma de 3 + 5 y muestra el resultado.",
                bloques: [
                    { texto: "int resultado", cat: "variables" },
                    { texto: "resultado = 3 + 5", cat: "operations" },
                    { texto: "println(resultado)", cat: "logical" }
                ]
            },
            4: {
                titulo: "Ejercicio 4 — Hola 5 veces",
                descripcion: "Usa un bucle do-while para imprimir 'Hola.' 5 veces. Necesitas un contador que vaya de 0 a 5.",
                bloques: [
                    { texto: "int a = 0", cat: "variables" },
                    { texto: "repetir", cat: "loops" },
                    { texto: "println(\"Hola\")", cat: "logical" },
                    { texto: "a = a + 1  (usar sangría)", cat: "operations" },
                    { texto: "mientras (a < 6)", cat: "loops" }
                ]
            },
            5: {
                titulo: "Ejercicio 5 — Contar del 1 al 10",
                descripcion: "Usa un bucle do-while para contar del 1 al 10 e imprimir cada número por consola.",
                bloques: [
                    { texto: "int contador = 0", cat: "variables" },
                    { texto: "repetir", cat: "loops" },
                    { texto: "contador = contador + 1  (usar sangría)", cat: "operations" },
                    { texto: "println(contador)  (usar sangría)", cat: "logical" },
                    { texto: "mientras (contador < 11)", cat: "loops" }
                ]
            },
            6: {
                titulo: "Ejercicio 6 — Condicional y sumatorio",
                descripcion: "Comprueba si 'a' es mayor que 10. Si lo es, muéstralo. Luego calcula el sumatorio del 1 al 10.",
                bloques: [
                    { texto: "int a = 0, int suma = 0", cat: "variables" },
                    { texto: "if (a > 10)", cat: "conditions" },
                    { texto: "println(a) + println(\"es mayor que 10\")", cat: "logical" },
                    { texto: "repetir → suma = suma + a + a = a + 1", cat: "loops" },
                    { texto: "mientras (a < 11)", cat: "loops" },
                    { texto: "println(suma)", cat: "logical" }
                ]
            },
            7: {
                titulo: "Ejercicio 7 — Lógica compleja",
                descripcion: "Ejercicio de lógica avanzada. ¡Piensa bien tu algoritmo!",
                bloques: [
                    { texto: "Usa los bloques que necesites", cat: "variables" }
                ]
            },
            8: {
                titulo: "Ejercicio 8 — Mayores que 5",
                descripcion: "Cuenta cuántos números son mayores que 5 entre los 10 primeros números naturales (1-10).",
                bloques: [
                    { texto: "int contador = 0, int i = 1", cat: "variables" },
                    { texto: "repetir", cat: "loops" },
                    { texto: "if (i > 5)  (usar sangría)", cat: "conditions" },
                    { texto: "contador = contador + 1  (usar sangría x2)", cat: "operations" },
                    { texto: "i = i + 1  (usar sangría)", cat: "operations" },
                    { texto: "mientras (i < 11)", cat: "loops" },
                    { texto: "print(\"Del 1 al 10 hay...\")", cat: "logical" }
                ]
            },
            9: {
                titulo: "Ejercicio 9 — Mayor de edad",
                descripcion: "Dada una edad, determina si la persona es mayor o menor de edad usando un if-else.",
                bloques: [
                    { texto: "int edad = 19", cat: "variables" },
                    { texto: "if (edad > 18)", cat: "conditions" },
                    { texto: "println(\"mayor de edad\")  (usar sangría)", cat: "logical" },
                    { texto: "else", cat: "conditions" },
                    { texto: "println(\"menor de edad\")  (usar sangría)", cat: "logical" }
                ]
            }
        };

        // Renderizar lista de ejercicios
        CATALOGO_ALGORITMOS.forEach(ej => {
            const item = document.createElement('div');
            const difClass = ej.dificultad === 'fácil' ? 'dif-facil' : ej.dificultad === 'medio' ? 'dif-medio' : 'dif-dificil';
            item.className = 'ejercicio-item ' + difClass;
            item.innerHTML = `Ejercicio ${ej.id} <span class="ej-badge">${ej.dificultad}</span>`;
            item.addEventListener('click', () => showDetail(ej));
            ejerciciosList.appendChild(item);
        });

        // Mostrar detalle de un ejercicio
        function showDetail(ej) {
            ejerciciosList.style.display = 'none';
            ejercicioDetail.style.display = 'block';

            const detail = EJERCICIOS_DETALLE[ej.id];
            const difClass = ej.dificultad === 'fácil' ? 'dif-facil' : ej.dificultad === 'medio' ? 'dif-medio' : 'dif-dificil';

            let bloquesHTML = '';
            /*
            if (detail && detail.bloques) {
                bloquesHTML = '<div class="ej-pistas"><h4>📦 Bloques necesarios (en orden):</h4>';
                detail.bloques.forEach(b => {
                    bloquesHTML += `<span class="pista-bloque cat-${b.cat}">${b.texto}</span>`;
                });
                bloquesHTML += '</div>';
            }
            */

            ejercicioContent.innerHTML = `
                <div class="ejercicio-detail-card">
                    <h3>${detail ? detail.titulo : 'Ejercicio ' + ej.id}</h3>
                    <span class="ej-dificultad ${difClass}">${ej.dificultad}</span>
                    <p class="ej-enunciado">${detail ? detail.descripcion : ej.enunciado}</p>
                    ${bloquesHTML}
                </div>`;
        }

        // Botón volver
        ejercicioBackBtn.addEventListener('click', () => {
            ejercicioDetail.style.display = 'none';
            ejerciciosList.style.display = 'flex';
        });

        // ─── Cronómetro ───
        let tiempoInicio;
        let intervalo;
        let funcionando = false;
        let segundosTranscurridos = 0;
        let idEjercicioActivo = 1;

        const TIEMPO_LIMITE = 240; // 4 minutos en segundos

        // ─── Música épica de competición (sin API key) ───
        const musicaCompeticion = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
        musicaCompeticion.loop = true;
        musicaCompeticion.volume = 0.5;
        musicaCompeticion.preload = 'auto';

        const btnControl  = document.getElementById('btn-control');
        const displayTiempo = document.getElementById('display-tiempo');
        const infoEjercicio = document.getElementById('info-ejercicio');

        btnControl.addEventListener('click', gestionarCronometro);

        function gestionarCronometro() {
            if (!funcionando) {
                funcionando = true;
                btnControl.innerText = 'PARAR';
                segundosTranscurridos = 0;
                displayTiempo.innerText = formatearTiempo(TIEMPO_LIMITE);
                
                // Reproducir música épica
                musicaCompeticion.currentTime = 0;
                musicaCompeticion.play().catch(() => {});
                
                intervalo = setInterval(() => {
                    segundosTranscurridos++;
                    const restante = TIEMPO_LIMITE - segundosTranscurridos;
                    displayTiempo.innerText = formatearTiempo(Math.max(0, restante));
                    if (restante <= 0) {
                        funcionando = false;
                        clearInterval(intervalo);
                        segundosGuardados = segundosTranscurridos;
                        btnControl.innerText = 'REINTENTAR';
                        displayTiempo.innerText = '00:00';
                        musicaCompeticion.pause();
                    }
                }, 1000);
            } else {
                funcionando = false;
                clearInterval(intervalo);
                segundosGuardados = segundosTranscurridos;
                btnControl.innerText = 'REINTENTAR';
                musicaCompeticion.pause();
            }
        }

        function formatearTiempo(segundos) {
            const mins = Math.floor(segundos / 60);
            const secs = segundos % 60;
            return `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
        }
    }

    // ─── Touch support (móviles) ───
    let touchClone  = null;
    let touchBlock  = null;
    let touchSource = null;

    palette.addEventListener('touchstart', handleTouchStart, { passive: false });
    dropZone.addEventListener('touchstart', handleTouchStartWS, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    function handleTouchStart(e) {
        const block = e.target.closest('.block');
        if (!block) return;
        e.preventDefault();
        touchBlock  = block;
        touchSource = 'palette';
        startTouchDrag(e, block);
    }

    function handleTouchStartWS(e) {
        const block = e.target.closest('.workspace-block');
        if (!block || e.target.closest('.delete-btn')) return;
        e.preventDefault();
        touchBlock  = block;
        touchSource = 'workspace';
        block.classList.add('dragging');
        startTouchDrag(e, block);
    }

    function startTouchDrag(e, block) {
        const touch = e.touches[0];
        touchClone = block.cloneNode(true);
        touchClone.style.position = 'fixed';
        touchClone.style.zIndex   = '9999';
        touchClone.style.pointerEvents = 'none';
        touchClone.style.opacity  = '0.8';
        touchClone.style.width    = block.offsetWidth + 'px';
        touchClone.style.left     = (touch.clientX - block.offsetWidth / 2) + 'px';
        touchClone.style.top      = (touch.clientY - 20) + 'px';
        document.body.appendChild(touchClone);
    }

    function handleTouchMove(e) {
        if (!touchClone) return;
        e.preventDefault();
        const touch = e.touches[0];
        touchClone.style.left = (touch.clientX - touchClone.offsetWidth / 2) + 'px';
        touchClone.style.top  = (touch.clientY - 20) + 'px';
    }

    function handleTouchEnd(e) {
        if (!touchClone || !touchBlock) return;

        const touch = e.changedTouches[0];
        const dzRect = dropZone.getBoundingClientRect();

        document.body.removeChild(touchClone);
        touchClone = null;

        if (touchBlock.classList) touchBlock.classList.remove('dragging');

        // Comprobar si soltó dentro del drop zone
        if (touch.clientX >= dzRect.left && touch.clientX <= dzRect.right &&
            touch.clientY >= dzRect.top  && touch.clientY <= dzRect.bottom) {

            if (touchSource === 'palette') {
                const wsBlock = createWorkspaceBlock(
                    touchBlock.dataset.code,
                    touchBlock.dataset.category,
                    touchBlock.dataset.display
                );
                // Insertar en posición
                const blocks = [...dropZone.querySelectorAll('.workspace-block')];
                let ref = null;
                for (const b of blocks) {
                    const rect = b.getBoundingClientRect();
                    if (touch.clientY < rect.top + rect.height / 2) { ref = b; break; }
                }
                if (ref) dropZone.insertBefore(wsBlock, ref);
                else     dropZone.appendChild(wsBlock);
            } else if (touchSource === 'workspace') {
                const blocks = [...dropZone.querySelectorAll('.workspace-block:not(.dragging)')];
                let ref = null;
                for (const b of blocks) {
                    const rect = b.getBoundingClientRect();
                    if (touch.clientY < rect.top + rect.height / 2) { ref = b; break; }
                }
                if (ref && ref !== touchBlock) dropZone.insertBefore(touchBlock, ref);
                else if (!ref) dropZone.appendChild(touchBlock);
            }

            updateCounter();
        }

        touchBlock  = null;
        touchSource = null;
    }
}

/* =============================================
   2. REGISTRO DE JUGADORES
   ============================================= */
function initRegistro() {

    const form      = document.getElementById('playerForm');
    const container = document.getElementById('playersContainer');
    const STORAGE   = 'feria_players';

    // Cargar jugadores guardados
    let players = JSON.parse(localStorage.getItem(STORAGE) || '[]');

    renderPlayers();

    // ─── Agregar jugador ───
    form.addEventListener('submit', e => {
        e.preventDefault();

        const name   = document.getElementById('playerName').value.trim();
        const center = document.getElementById('playerCenter').value.trim();
        if (!name || !center) return;

        players.push({
            id:     Date.now(),
            name:   name,
            center: center,
            points: 0,
            date:   new Date().toLocaleDateString('es-ES')
        });

        save();
        renderPlayers();
        form.reset();
        document.getElementById('playerName').focus();
    });

    // ─── Guardar en localStorage ───
    function save() {
        localStorage.setItem(STORAGE, JSON.stringify(players));
    }

    // ─── Renderizar tabla de jugadores ───
    function renderPlayers() {
        if (players.length === 0) {
            container.innerHTML = '<p class="empty-state">No hay jugadores registrados aún. ¡Agrega el primero!</p>';
            return;
        }

        // Ordenar por puntos (mayor a menor)
        const sorted = [...players].sort((a, b) => b.points - a.points);

        const medals = ['🥇', '🥈', '🥉'];

        let html = `
        <table class="players-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Centro</th>
                    <th>Puntos</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>`;

        sorted.forEach((p, i) => {
            const rank     = i < 3 ? medals[i] : (i + 1);
            const firstCls = i === 0 ? ' first-place' : '';

            html += `
                <tr class="${firstCls}" data-id="${p.id}">
                    <td class="rank" data-label="#">${rank}</td>
                    <td class="nombre" data-label="Nombre">${escapeHTML(p.name)}</td>
                    <td class="centro" data-label="Centro">${escapeHTML(p.center)}</td>
                    <td class="puntos" data-label="Puntos">
                        <input type="number" class="points-input" value="${p.points}" min="0" data-id="${p.id}">
                    </td>
                    <td class="fecha" data-label="Fecha">${p.date}</td>
                    <td class="acciones" data-label="Acciones">
                        <button class="btn-delete" data-id="${p.id}" title="Eliminar">🗑</button>
                    </td>
                </tr>`;
        });

        html += '</tbody></table>';
        container.innerHTML = html;

        // Eventos de puntos
        container.querySelectorAll('.points-input').forEach(input => {
            input.addEventListener('change', e => {
                const id  = parseInt(e.target.dataset.id);
                const val = Math.max(0, parseInt(e.target.value) || 0);
                const player = players.find(p => p.id === id);
                if (player) {
                    player.points = val;
                    save();
                    renderPlayers();
                }
            });
        });

        // Eventos de eliminar
        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', e => {
                const id = parseInt(e.currentTarget.dataset.id);
                if (confirm('¿Eliminar este jugador?')) {
                    players = players.filter(p => p.id !== id);
                    save();
                    renderPlayers();
                }
            });
        });
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

/* =============================================
   3. PÁGINA DE CAMPEONES
   ============================================= */
function initCampeones() {

    const podio            = document.getElementById('podio');
    const rankingContainer = document.getElementById('rankingContainer');
    const STORAGE          = 'feria_players';

    renderCampeones();

    // Actualizar cada 5 segundos por si se añaden jugadores desde otra pestaña
    setInterval(renderCampeones, 5000);

    function renderCampeones() {
        const players = JSON.parse(localStorage.getItem(STORAGE) || '[]');

        // Ordenar por puntos (mayor a menor)
        const sorted = [...players].sort((a, b) => b.points - a.points);

        renderPodio(sorted);
        renderRanking(sorted);
    }

    function renderPodio(sorted) {
        if (sorted.length === 0) {
            podio.innerHTML = '<p class="podio-empty">🏁 Aún no hay participantes registrados</p>';
            return;
        }

        const medals  = ['🥇', '🥈', '🥉'];
        const classes = ['first', 'second', 'third'];
        const labels  = ['1°', '2°', '3°'];

        // Orden visual: 2do - 1ro - 3ro (para el efecto podio clásico)
        const order = sorted.length >= 3 ? [1, 0, 2] : (sorted.length === 2 ? [1, 0] : [0]);

        let html = '';
        order.forEach(i => {
            if (!sorted[i]) return;
            const p = sorted[i];
            html += `
            <div class="podio-place ${classes[i]}">
                <span class="podio-medal">${medals[i]}</span>
                <span class="podio-name">${escapeHTML(p.name)}</span>
                <span class="podio-center">${escapeHTML(p.center)}</span>
                <span class="podio-points">${p.points} pts</span>
                <div class="podio-bar">${labels[i]}</div>
            </div>`;
        });

        podio.innerHTML = html;
    }

    function renderRanking(sorted) {
        if (sorted.length === 0) {
            rankingContainer.innerHTML = '<p class="empty-state">Aún no hay participantes. ¡Regístralos en la sección de Registro!</p>';
            return;
        }

        const medals = ['🥇', '🥈', '🥉'];

        let html = `
        <table class="ranking-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Centro</th>
                    <th>Puntos</th>
                    <th>Fecha</th>
                </tr>
            </thead>
            <tbody>`;

        sorted.forEach((p, i) => {
            const rank    = i < 3 ? medals[i] : (i + 1);
            const topClass = i < 3 ? ` top-${i + 1}` : '';

            html += `
                <tr class="${topClass}">
                    <td class="rank-cell" data-label="#">${rank}</td>
                    <td class="name-cell" data-label="Nombre">${escapeHTML(p.name)}</td>
                    <td class="center-cell" data-label="Centro">${escapeHTML(p.center)}</td>
                    <td class="points-cell" data-label="Puntos">
                        <span class="points-badge">${p.points} pts</span>
                    </td>
                    <td class="date-cell" data-label="Fecha">${p.date || '—'}</td>
                </tr>`;
        });

        html += '</tbody></table>';
        rankingContainer.innerHTML = html;
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}
