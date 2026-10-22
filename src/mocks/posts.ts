import type { Attachment } from '@/types';
import { diagramThumbnail } from './assets';

export interface MockPost {
  id: string;
  title: string;
  description?: string;
  authorId: string;
  careerId: string;
  subjectId: string;
  attachments: Attachment[];
  createdAt: string;
  updatedAt?: string;
  commentCount: number;
  /** Valoraciones históricas (de usuarios que no están en el mock). */
  baseRatingSum: number;
  baseRatingCount: number;
}

const HOUR = 60 * 60 * 1000;
const hoursAgo = (h: number) => new Date(Date.now() - h * HOUR).toISOString();

const pdf = (id: string, name: string, sizeBytes: number): Attachment => ({
  id,
  kind: 'pdf',
  name,
  sizeBytes,
  mimeType: 'application/pdf',
});

const image = (
  id: string,
  name: string,
  style: Parameters<typeof diagramThumbnail>[0],
  label: string,
  sizeBytes = 240_000,
): Attachment => ({
  id,
  kind: 'image',
  name,
  sizeBytes,
  mimeType: 'image/svg+xml',
  url: diagramThumbnail(style, label),
});

const link = (id: string, name: string, url: string): Attachment => ({ id, kind: 'link', name, url });

/** Promedio × cantidad → suma, para escribir los datos de forma legible. */
const rating = (avg: number, count: number) => ({
  baseRatingSum: Math.round(avg * count),
  baseRatingCount: count,
});

export function createMockPosts(): MockPost[] {
  return [
    {
      id: 'p1',
      title: 'Resumen de árboles AVL con ejemplos de rotaciones',
      description:
        'Explico las cuatro rotaciones (LL, RR, LR, RL) con dibujos paso a paso y un ejercicio resuelto de inserción y eliminación. Sirve para el parcial 2.',
      authorId: 'u4',
      careerId: 'sis',
      subjectId: 'sis-estructuras',
      attachments: [
        pdf('p1-a1', 'Arboles-AVL-resumen.pdf', 1_850_000),
        image('p1-a2', 'rotaciones-avl.svg', 'tree', 'Rotación doble LR'),
      ],
      createdAt: hoursAgo(2),
      commentCount: 8,
      ...rating(4.6, 14),
    },
    {
      id: 'p2',
      title: 'Ejercicios resueltos de integrales dobles y triples',
      description:
        'Taller de 20 ejercicios con cambio a coordenadas polares, cilíndricas y esféricas. Incluye la región de integración dibujada en cada caso.',
      authorId: 'u2',
      careerId: 'ind',
      subjectId: 'ind-calculo2',
      attachments: [pdf('p2-a1', 'Taller-integrales-multiples.pdf', 3_420_000)],
      createdAt: hoursAgo(5),
      commentCount: 12,
      ...rating(4.8, 21),
    },
    {
      id: 'p3',
      title: 'Simulador en línea para practicar leyes de Kirchhoff',
      description:
        'Si aprendes mejor experimentando, este simulador permite armar circuitos y ver corrientes en tiempo real. Dejo un circuito de ejemplo para la tarea 3.',
      authorId: 'u3',
      careerId: 'ele',
      subjectId: 'ele-circuitos',
      attachments: [
        link('p3-a1', 'Falstad Circuit Simulator', 'https://www.falstad.com/circuit/'),
        image('p3-a2', 'circuito-tarea-3.svg', 'circuit', 'Malla con dos fuentes'),
      ],
      createdAt: hoursAgo(9),
      commentCount: 5,
      ...rating(4.4, 9),
    },
    {
      id: 'p4',
      title: 'Guía de normalización hasta 3FN con casos reales',
      description:
        'Partimos de una tabla de facturación desordenada y la llevamos a 3FN explicando cada dependencia funcional. Incluye el diagrama entidad-relación final.',
      authorId: 'u1',
      careerId: 'sis',
      subjectId: 'sis-bases',
      attachments: [
        pdf('p4-a1', 'Normalizacion-3FN.pdf', 2_100_000),
        image('p4-a2', 'modelo-entidad-relacion.svg', 'graph', 'Modelo E-R facturación'),
      ],
      createdAt: hoursAgo(26),
      commentCount: 6,
      ...rating(4.5, 11),
    },
    {
      id: 'p5',
      title: 'Diagramas de cuerpo libre: plantilla y 10 ejercicios',
      description: 'Plantilla para no olvidar ninguna fuerza y diez ejercicios de vigas y armaduras con respuesta.',
      authorId: 'u5',
      careerId: 'civ',
      subjectId: 'civ-estatica',
      attachments: [
        pdf('p5-a1', 'DCL-plantilla-y-ejercicios.pdf', 1_240_000),
        image('p5-a2', 'dcl-viga.svg', 'graph', 'DCL viga simplemente apoyada'),
      ],
      createdAt: hoursAgo(36),
      commentCount: 3,
      ...rating(4.2, 6),
    },
    {
      id: 'p6',
      title: 'Mapas de Karnaugh paso a paso (apuntes de clase)',
      description:
        'Apuntes pasados en limpio de la clase de simplificación con mapas de 3 y 4 variables, más dos fotos del tablero con los agrupamientos.',
      authorId: 'u6',
      careerId: 'ele',
      subjectId: 'ele-digitales',
      attachments: [
        pdf('p6-a1', 'Karnaugh-apuntes.pdf', 980_000),
        image('p6-a2', 'mapa-k-3-variables.svg', 'chart', 'Mapa K de 3 variables'),
        image('p6-a3', 'mapa-k-4-variables.svg', 'chart', 'Mapa K de 4 variables'),
      ],
      createdAt: hoursAgo(50),
      commentCount: 4,
      ...rating(4.0, 7),
    },
    {
      id: 'p7',
      title: 'Patrones de diseño explicados con diagramas UML',
      description:
        'Strategy, Observer, Factory y Singleton con su diagrama de clases y un ejemplo en Java. Al final hay un enlace a un catálogo muy completo.',
      authorId: 'u4',
      careerId: 'sis',
      subjectId: 'sis-poo',
      attachments: [
        pdf('p7-a1', 'Patrones-de-diseno-UML.pdf', 2_760_000),
        link('p7-a2', 'Catálogo de patrones (Refactoring.Guru)', 'https://refactoring.guru/es/design-patterns'),
      ],
      createdAt: hoursAgo(74),
      commentCount: 10,
      ...rating(4.7, 18),
    },
    {
      id: 'p8',
      title: 'Formulario de distribuciones de probabilidad',
      description: 'Una hoja con binomial, Poisson, normal, exponencial y t de Student: fórmulas, media, varianza y cuándo usar cada una.',
      authorId: 'u2',
      careerId: 'ind',
      subjectId: 'ind-estadistica',
      attachments: [pdf('p8-a1', 'Formulario-distribuciones.pdf', 640_000)],
      createdAt: hoursAgo(98),
      commentCount: 2,
      ...rating(4.9, 25),
    },
    {
      id: 'p9',
      title: 'Transformada de Fourier: intuición visual',
      description:
        'Para quienes no entendieron el video del curso: este video explica la idea con animaciones. Agrego mis notas con la notación que usa el profesor.',
      authorId: 'u3',
      careerId: 'ele',
      subjectId: 'ele-senales',
      attachments: [
        link('p9-a1', 'Video: ¿Qué es la transformada de Fourier? (3Blue1Brown)', 'https://www.youtube.com/watch?v=spUNpyF58BY'),
        pdf('p9-a2', 'Notas-Fourier.pdf', 1_120_000),
      ],
      createdAt: hoursAgo(122),
      commentCount: 7,
      ...rating(4.6, 13),
    },
    {
      id: 'p10',
      title: 'Mapa conceptual de series y sucesiones',
      description: 'Cuándo aplicar cada criterio de convergencia (razón, raíz, comparación, integral) en un solo diagrama.',
      authorId: 'u1',
      careerId: 'sis',
      subjectId: 'sis-calculo2',
      attachments: [image('p10-a1', 'mapa-criterios-convergencia.svg', 'tree', 'Criterios de convergencia')],
      createdAt: hoursAgo(146),
      commentCount: 4,
      ...rating(4.3, 8),
    },
    {
      id: 'p11',
      title: 'Apuntes de nivelación geométrica con ejemplos de campo',
      description: 'Registro de libreta, cálculo de cotas y corrección del error de cierre con datos de la práctica del sábado.',
      authorId: 'u5',
      careerId: 'civ',
      subjectId: 'civ-topografia',
      attachments: [pdf('p11-a1', 'Nivelacion-geometrica.pdf', 4_300_000)],
      createdAt: hoursAgo(194),
      commentCount: 1,
      ...rating(3.9, 5),
    },
    {
      id: 'p12',
      title: 'Laboratorio de amplificadores operacionales: guía y resultados',
      description: 'Montajes inversor, no inversor y sumador con las mediciones del osciloscopio y el análisis de error.',
      authorId: 'u6',
      careerId: 'ele',
      subjectId: 'ele-analoga',
      attachments: [
        pdf('p12-a1', 'Lab-amplificadores-operacionales.pdf', 5_600_000),
        image('p12-a2', 'montaje-inversor.svg', 'circuit', 'Amplificador inversor'),
      ],
      createdAt: hoursAgo(242),
      commentCount: 6,
      ...rating(4.1, 10),
    },
    {
      id: 'p13',
      title: 'Resumen del modelo OSI frente a TCP/IP',
      description: 'Infografía con las capas, sus protocolos y la unidad de datos de cada una, más un enlace a un curso libre.',
      authorId: 'u4',
      careerId: 'sis',
      subjectId: 'sis-redes',
      attachments: [
        image('p13-a1', 'osi-vs-tcpip.svg', 'graph', 'Capas OSI vs TCP/IP'),
        link('p13-a2', 'Curso libre de redes (Khan Academy)', 'https://www.khanacademy.org/computing/computers-and-internet'),
      ],
      createdAt: hoursAgo(290),
      commentCount: 3,
      ...rating(4.4, 12),
    },
    {
      id: 'p14',
      title: 'Método simplex: ejemplos con tabla y en Excel',
      description: 'Tres problemas de maximización resueltos a mano con la tabla simplex y verificados con Solver.',
      authorId: 'u2',
      careerId: 'ind',
      subjectId: 'ind-operaciones',
      attachments: [
        pdf('p14-a1', 'Simplex-ejemplos.pdf', 1_780_000),
        link('p14-a2', 'Calculadora gráfica GeoGebra', 'https://www.geogebra.org/graphing'),
      ],
      createdAt: hoursAgo(362),
      commentCount: 9,
      ...rating(4.5, 16),
    },
    {
      id: 'p15',
      title: 'Problemas de cinemática y dinámica resueltos',
      description: 'Movimiento parabólico, planos inclinados y poleas. Cada ejercicio trae el diagrama de fuerzas.',
      authorId: 'u3',
      careerId: 'ele',
      subjectId: 'ele-fisica',
      attachments: [pdf('p15-a1', 'Cinematica-y-dinamica.pdf', 2_250_000)],
      createdAt: hoursAgo(434),
      commentCount: 2,
      ...rating(4.0, 6),
    },
    {
      id: 'p16',
      title: 'Visualizaciones interactivas de algoritmos de ordenamiento',
      description: 'Para ver cómo se mueven los datos en burbuja, inserción, merge sort y quicksort. Muy útil antes del quiz.',
      authorId: 'u1',
      careerId: 'sis',
      subjectId: 'sis-estructuras',
      attachments: [link('p16-a1', 'VisuAlgo: ordenamiento', 'https://visualgo.net/es/sorting')],
      createdAt: hoursAgo(506),
      commentCount: 5,
      ...rating(4.6, 9),
    },
    {
      id: 'p17',
      title: 'Tabla de propiedades de materiales y fórmulas de esfuerzo',
      description: 'Módulo de elasticidad, resistencia a la fluencia y coeficiente de Poisson de los materiales más usados, con las fórmulas del curso.',
      authorId: 'u5',
      careerId: 'civ',
      subjectId: 'civ-materiales',
      attachments: [
        pdf('p17-a1', 'Propiedades-materiales.pdf', 870_000),
        image('p17-a2', 'curva-esfuerzo-deformacion.svg', 'chart', 'Curva esfuerzo-deformación'),
      ],
      createdAt: hoursAgo(600),
      commentCount: 4,
      ...rating(4.3, 7),
    },
  ];
}
