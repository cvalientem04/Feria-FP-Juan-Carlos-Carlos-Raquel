/* =============================================
   SCRIPT.JS — Constructor Visual Java + Registro
   ============================================= */

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
                const block = document.createElement('div');
                block.className = 'block cat-' + cat.cssClass;
                block.textContent = b.code;
                block.draggable = true;
                block.dataset.code     = b.code;
                block.dataset.category = cat.cssClass;
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
                draggedBlock.dataset.category
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
    function createWorkspaceBlock(code, category) {
        const div = document.createElement('div');
        div.className = 'workspace-block cat-' + category;
        div.draggable = true;
        div.dataset.code     = code;
        div.dataset.category = category;

        const span = document.createElement('span');
        span.className = 'code-text';
        span.textContent = code;
        div.appendChild(span);

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

        lines.forEach(line => {
            const trimmed = line.trim();

            // Si la línea cierra bloque, reducir indent primero
            if (trimmed === '}') {
                indent = Math.max(2, indent - 1);
            }

            code += '    '.repeat(indent) + trimmed + '\n';

            // Si la línea abre bloque { }, ajustar indent
            if (trimmed.endsWith('{ }') || trimmed.endsWith('{}')) {
                // bloque vacío → no cambiar indent
            } else if (trimmed.endsWith('{')) {
                indent++;
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

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            try {
                executeLine(line, vars);
            } catch (err) {
                errors.push({ line: i + 1, code: line, message: err.message });
            }
        }

        return { vars, errors };
    }

    function executeLine(line, vars) {
        // Ignorar llaves sueltas y bloques vacíos
        if (line === '{' || line === '}' || line === '{ }' || line === '{}') return;

        // Remover ; final
        let stmt = line.replace(/;$/, '').trim();

        // ─── Declaraciones: int x = expr; ───
        let m;

        // int x = expr;
        m = stmt.match(/^int\s+(\w+)\s*=\s*(.+)$/);
        if (m) {
            vars[m[1]] = { type: 'int', value: Math.floor(evalExpr(m[2], vars)) };
            return;
        }

        // double x = expr;
        m = stmt.match(/^double\s+(\w+)\s*=\s*(.+)$/);
        if (m) {
            vars[m[1]] = { type: 'double', value: evalExpr(m[2], vars) };
            return;
        }

        // boolean x = expr;
        m = stmt.match(/^boolean\s+(\w+)\s*=\s*(.+)$/);
        if (m) {
            vars[m[1]] = { type: 'boolean', value: evalBoolExpr(m[2], vars) };
            return;
        }

        // String x = "...";
        m = stmt.match(/^String\s+(\w+)\s*=\s*"([^"]*)"$/);
        if (m) {
            vars[m[1]] = { type: 'String', value: m[2] };
            return;
        }

        // ─── Asignaciones: x = expr ───
        m = stmt.match(/^(\w+)\s*=\s*(.+)$/);
        if (m) {
            const name = m[1];
            const expr = m[2].trim();

            // Ternario
            const ternary = expr.match(/^\((.+)\)\s*\?\s*(.+)\s*:\s*(.+)$/);
            if (ternary) {
                const cond = evalBoolExpr(ternary[1], vars);
                const val  = cond ? evalExpr(ternary[2], vars) : evalExpr(ternary[3], vars);
                const existingType = vars[name] ? vars[name].type : 'int';
                vars[name] = { type: existingType, value: existingType === 'int' ? Math.floor(val) : val };
                return;
            }

            // Boolean expr
            if (expr.includes('&&') || expr.includes('||') || expr.includes('.equals(') ||
                expr === 'true' || expr === 'false') {
                vars[name] = { type: 'boolean', value: evalBoolExpr(expr, vars) };
                return;
            }

            // Numérica
            const v = evalExpr(expr, vars);
            const existingType = vars[name] ? vars[name].type : (Number.isInteger(v) ? 'int' : 'double');
            vars[name] = { type: existingType, value: existingType === 'int' ? Math.floor(v) : v };
            return;
        }

        // ─── for loop simple ───
        const forMatch = stmt.match(/^for\s*\(\s*int\s+(\w+)\s*=\s*(\d+)\s*;\s*\1\s*<\s*(\d+)\s*;\s*\1\+\+\s*\)\s*\{\s*(.*?)\s*\}$/);
        if (forMatch) {
            const loopVar = forMatch[1];
            const start   = parseInt(forMatch[2]);
            const end     = parseInt(forMatch[3]);
            const body    = forMatch[4].trim();

            for (let i = start; i < end; i++) {
                vars[loopVar] = { type: 'int', value: i };
                if (body) executeLine(body + ';', vars);
            }
            // Limpiar variable del bucle
            delete vars[loopVar];
            return;
        }

        // ─── while loop simple ───
        const whileMatch = stmt.match(/^while\s*\((.+)\)\s*\{\s*(.*?)\s*\}$/);
        if (whileMatch) {
            const cond = whileMatch[1].trim();
            const body = whileMatch[2].trim();
            let safety = 0;
            while (evalBoolExpr(cond, vars) && safety < 1000) {
                if (body) executeLine(body + ';', vars);
                safety++;
            }
            return;
        }

        // ─── if / else (simplificado — bloque vacío) ───
        const ifMatch = stmt.match(/^if\s*\((.+)\)\s*\{\s*\}$/);
        if (ifMatch) return; // bloque vacío, no hacer nada

        const elseMatch = stmt.match(/^else\s*\{\s*\}$/);
        if (elseMatch) return;
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

        const varKeys = Object.keys(result.vars);
        if (varKeys.length === 0) {
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
                    touchBlock.dataset.category
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
