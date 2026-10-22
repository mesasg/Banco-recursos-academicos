export interface MockCareer {
  id: string;
  name: string;
  shortName: string;
  subjects: { id: string; name: string }[];
}

export const mockCareers: MockCareer[] = [
  {
    id: 'sis',
    name: 'Ingeniería de Sistemas',
    shortName: 'Ing. de Sistemas',
    subjects: [
      { id: 'sis-calculo2', name: 'Cálculo II' },
      { id: 'sis-estructuras', name: 'Estructuras de Datos' },
      { id: 'sis-bases', name: 'Bases de Datos' },
      { id: 'sis-poo', name: 'Programación Orientada a Objetos' },
      { id: 'sis-redes', name: 'Redes de Computadores' },
      { id: 'sis-software', name: 'Ingeniería de Software' },
    ],
  },
  {
    id: 'ind',
    name: 'Ingeniería Industrial',
    shortName: 'Ing. Industrial',
    subjects: [
      { id: 'ind-calculo2', name: 'Cálculo II' },
      { id: 'ind-fisica', name: 'Física Mecánica' },
      { id: 'ind-estadistica', name: 'Estadística y Probabilidad' },
      { id: 'ind-operaciones', name: 'Investigación de Operaciones' },
      { id: 'ind-calidad', name: 'Gestión de la Calidad' },
    ],
  },
  {
    id: 'ele',
    name: 'Ingeniería Electrónica',
    shortName: 'Ing. Electrónica',
    subjects: [
      { id: 'ele-circuitos', name: 'Circuitos Eléctricos I' },
      { id: 'ele-fisica', name: 'Física Mecánica' },
      { id: 'ele-digitales', name: 'Sistemas Digitales' },
      { id: 'ele-analoga', name: 'Electrónica Análoga' },
      { id: 'ele-senales', name: 'Señales y Sistemas' },
    ],
  },
  {
    id: 'civ',
    name: 'Ingeniería Civil',
    shortName: 'Ing. Civil',
    subjects: [
      { id: 'civ-estatica', name: 'Estática' },
      { id: 'civ-materiales', name: 'Resistencia de Materiales' },
      { id: 'civ-topografia', name: 'Topografía' },
      { id: 'civ-suelos', name: 'Mecánica de Suelos' },
    ],
  },
];
