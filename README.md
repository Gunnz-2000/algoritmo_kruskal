# Algoritmo de Kruskal - Visualizador Interactivo

Una aplicación web moderna e interactiva para resolver problemas de árbol de expansión mínima usando el algoritmo de Kruskal.

## Funcionalidades

### Creación de Grafos
- **Agregar Nodos**: Haz clic en el botón y luego en el área del grafo
- **Conectar Nodos**: Selecciona dos nodos para crear una arista con peso
- **Pesos Personalizados**: Asigna pesos a las aristas (1-100)

### Algoritmo de Kruskal
- **Ejecución Completa**: Encuentra el MST instantáneamente
- **Modo Paso a Paso**: Visualiza cada decisión del algoritmo
- **Detección de Ciclos**: Usa Union-Find para evitar ciclos
- **Optimización**: Implementación con path compression y union by rank

### Visualización
- **Nodos Interactivos**: Círculos con etiquetas (A, B, C...)
- **Aristas con Pesos**: Líneas que muestran el peso de cada conexión
- **MST Destacado**: Las aristas del árbol mínimo se resaltan en rojo
- **Animaciones**: Transiciones suaves y efectos visuales

### Ejemplos Incluidos
1. **Grafo Simple**: 4 nodos con 5 aristas (peso óptimo: 9)
2. **Grafo Complejo**: 6 nodos con 9 aristas para mayor complejidad
3. **Grafo Desconectado**: Muestra comportamiento con componentes separados

## Uso de la Aplicación

### 1. Crear un Grafo
```
1. Haz clic en "Agregar Nodo"
2. Haz clic en el área del grafo para colocar nodos
3. Haz clic en "Agregar Arista"
4. Selecciona dos nodos y asigna un peso
```

### 2. Ejecutar el Algoritmo
```
- "Ejecutar Kruskal": Muestra el resultado inmediatamente
- "Paso a Paso": Visualiza cada decisión del algoritmo
- "Reiniciar": Vuelve al estado inicial
```

### 3. Interpretar Resultados
```
- Peso Total: Suma de pesos de las aristas del MST
- Aristas del MST: Número de conexiones en el árbol mínimo
- Tiempo: Duración de la ejecución del algoritmo
```

