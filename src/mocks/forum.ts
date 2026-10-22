export interface MockThread {
  id: string;
  title: string;
  body: string;
  authorId: string;
  subjectId: string;
  createdAt: string;
  acceptedReplyId?: string;
}

export interface MockReply {
  id: string;
  threadId: string;
  body: string;
  authorId: string;
  createdAt: string;
}

const HOUR = 60 * 60 * 1000;
const hoursAgo = (h: number) => new Date(Date.now() - h * HOUR).toISOString();

export function createMockForum(): { threads: MockThread[]; replies: MockReply[] } {
  const threads: MockThread[] = [
    {
      id: 't1',
      title: '¿Cuándo se usa una rotación doble en un árbol AVL?',
      body: 'Entiendo las rotaciones simples, pero en el taller no sé identificar cuándo toca hacer LR o RL. ¿Hay alguna regla rápida para saberlo mirando los factores de balance?',
      authorId: 'u1',
      subjectId: 'sis-estructuras',
      createdAt: hoursAgo(20),
      acceptedReplyId: 'r2',
    },
    {
      id: 't2',
      title: 'Diferencia entre lista enlazada y arreglo dinámico en complejidad',
      body: '¿Por qué insertar al inicio es O(1) en la lista y O(n) en el arreglo? ¿Y qué pasa con el acceso por índice?',
      authorId: 'u5',
      subjectId: 'sis-estructuras',
      createdAt: hoursAgo(72),
    },
    {
      id: 't3',
      title: '¿La 3FN siempre elimina las dependencias transitivas?',
      body: 'En el ejemplo de facturación del profe quedó una tabla con ciudad y código postal. ¿Eso viola la 3FN o depende del caso?',
      authorId: 'u4',
      subjectId: 'sis-bases',
      createdAt: hoursAgo(30),
    },
    {
      id: 't4',
      title: '¿Cómo saber cuándo cambiar a coordenadas polares en una integral doble?',
      body: 'Me pasa que hago todo en cartesianas y queda una integral imposible. ¿Qué señales en la región o en la función indican que conviene polares?',
      authorId: 'u2',
      subjectId: 'ind-calculo2',
      createdAt: hoursAgo(8),
    },
    {
      id: 't5',
      title: 'Ley de corrientes de Kirchhoff con fuentes dependientes',
      body: 'En el ejercicio 4 del taller hay una fuente de corriente controlada por voltaje. ¿Se plantea la ecuación del nodo igual o hay que agregar una ecuación extra?',
      authorId: 'u6',
      subjectId: 'ele-circuitos',
      createdAt: hoursAgo(14),
      acceptedReplyId: 'r9',
    },
    {
      id: 't6',
      title: 'Criterio de la razón vs. criterio de la raíz',
      body: '¿Hay casos donde uno funcione y el otro no? Siempre uso la razón pero con potencias n-ésimas se me complica.',
      authorId: 'u4',
      subjectId: 'sis-calculo2',
      createdAt: hoursAgo(50),
    },
    {
      id: 't7',
      title: '¿Cuándo usar la distribución t en lugar de la normal?',
      body: 'Para el parcial de intervalos de confianza no me queda claro si depende del tamaño de muestra o de si conozco la varianza.',
      authorId: 'u3',
      subjectId: 'ind-estadistica',
      createdAt: hoursAgo(96),
      acceptedReplyId: 'r13',
    },
    {
      id: 't8',
      title: 'Interpretación física de la transformada de Fourier',
      body: '¿Qué significa realmente que una señal tenga componentes en frecuencias negativas?',
      authorId: 'u6',
      subjectId: 'ele-senales',
      createdAt: hoursAgo(130),
    },
    {
      id: 't9',
      title: 'Apoyo articulado vs. empotrado en el diagrama de cuerpo libre',
      body: '¿Cuántas reacciones pone cada tipo de apoyo? Siempre se me olvida el momento en el empotramiento.',
      authorId: 'u5',
      subjectId: 'civ-estatica',
      createdAt: hoursAgo(40),
    },
    {
      id: 't10',
      title: '¿Interfaz o clase abstracta para el patrón Strategy?',
      body: 'En Java, ¿qué es mejor para definir las estrategias? El ejemplo del recurso usa interfaz pero en clase vimos clase abstracta.',
      authorId: 'u2',
      subjectId: 'sis-poo',
      createdAt: hoursAgo(5),
    },
  ];

  const replies: MockReply[] = [
    { id: 'r1', threadId: 't1', authorId: 'u3', createdAt: hoursAgo(19), body: 'Yo me guío por los signos: si el nodo desbalanceado y su hijo tienen el mismo signo es simple; si son opuestos, es doble.' },
    { id: 'r2', threadId: 't1', authorId: 'u4', createdAt: hoursAgo(18), body: 'Exacto. Factor +2 en el nodo y -1 en su hijo izquierdo → LR: primero rotas a la izquierda el hijo y luego a la derecha el nodo. En el PDF de AVL que subí está el ejemplo paso a paso.' },
    { id: 'r3', threadId: 't1', authorId: 'u1', createdAt: hoursAgo(17), body: '¡Gracias! Con la regla de los signos ya me salió el ejercicio 3.' },
    { id: 'r4', threadId: 't2', authorId: 'u4', createdAt: hoursAgo(70), body: 'En el arreglo hay que desplazar todos los elementos para abrir espacio al inicio; en la lista solo cambias el puntero de la cabeza. El acceso por índice es al revés: O(1) en arreglo y O(n) en lista.' },
    { id: 'r5', threadId: 't3', authorId: 'u1', createdAt: hoursAgo(28), body: 'Si el código postal determina la ciudad, hay dependencia transitiva y se debería separar. Pero en la práctica muchos lo dejan así por rendimiento.' },
    { id: 'r6', threadId: 't3', authorId: 'u2', createdAt: hoursAgo(26), body: 'Ojo que en Colombia un código postal puede no mapear a una sola ciudad, entonces depende de las reglas del negocio.' },
    { id: 'r7', threadId: 't4', authorId: 'u3', createdAt: hoursAgo(6), body: 'Si ves x² + y² en la función o la región es un círculo, anillo o sector, casi siempre conviene polares. No olvides el jacobiano r.' },
    { id: 'r8', threadId: 't5', authorId: 'u3', createdAt: hoursAgo(13), body: 'Planteas el nodo igual y escribes la variable de control en términos de los voltajes de nodo. Así no necesitas una ecuación extra.' },
    { id: 'r9', threadId: 't5', authorId: 'u4', createdAt: hoursAgo(12), body: 'Complemento: si la fuente controlada queda entre dos nodos sin referencia, usa un supernodo. El simulador de Falstad ayuda a verificar.' },
    { id: 'r10', threadId: 't6', authorId: 'u1', createdAt: hoursAgo(45), body: 'La raíz es más fuerte: si la razón es concluyente, la raíz también. Con términos tipo (algo)^n usa la raíz directamente.' },
    { id: 'r11', threadId: 't7', authorId: 'u2', createdAt: hoursAgo(94), body: 'Usas t cuando no conoces la desviación estándar poblacional y la estimas con la muestra. Con n grande la t se parece mucho a la normal.' },
    { id: 'r12', threadId: 't7', authorId: 'u5', createdAt: hoursAgo(92), body: 'La regla de n > 30 es solo una aproximación; lo importante es si conoces sigma.' },
    { id: 'r13', threadId: 't7', authorId: 'u4', createdAt: hoursAgo(90), body: 'Resumen: σ conocida → normal (Z). σ desconocida → t con n − 1 grados de libertad. En el formulario de distribuciones están ambas.' },
    { id: 'r14', threadId: 't9', authorId: 'u6', createdAt: hoursAgo(38), body: 'Articulado: dos reacciones (horizontal y vertical). Empotrado: dos fuerzas más un momento. El rodillo solo una, perpendicular a la superficie.' },
  ];

  return { threads, replies };
}
