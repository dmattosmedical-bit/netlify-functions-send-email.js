// ===================================================================
// CATÁLOGO DE PRODUTOS — FONTE DE PREÇO CONFIÁVEL (BACKEND ONLY)
// Nenhum preço é definido no frontend. Tudo sai daqui.
// ===================================================================

const PRODUCTS = {
  'dysport': {
    id: 'dysport',
    name: 'Dysport',
    description: 'Toxina botulínica para tratamento de rugas e linhas de expressão.',
    price: 1600.00,
    currency: 'BRL',
    category: 'toxinas'
  },
  'sculptra': {
    id: 'sculptra',
    name: 'Sculptra',
    description: 'Bioestimulador de colágeno para volume e rejuvenescimento facial.',
    price: 1600.00,
    currency: 'BRL',
    category: 'bioestimuladores'
  },
  'linebody-hard': {
    id: 'linebody-hard',
    name: 'LineBody Hard',
    description: 'Preenchedor de alta densidade para remodelação corporal e facial.',
    price: 1600.00,
    currency: 'BRL',
    category: 'preenchedores'
  },
  'linebody-soft': {
    id: 'linebody-soft',
    name: 'LineBody Soft',
    description: 'Preenchedor de baixa densidade para áreas delicadas e sutis.',
    price: 1600.00,
    currency: 'BRL',
    category: 'preenchedores'
  },
  'nabota': {
    id: 'nabota',
    name: 'Nabota',
    description: 'Toxina botulínica de origem coreana, alta pureza e eficácia.',
    price: 1600.00,
    currency: 'BRL',
    category: 'toxinas'
  },
  'momm': {
    id: 'momm',
    name: 'Momm',
    description: 'Preenchedor corporal e facial com tecnologia avançada de hidratação.',
    price: 1600.00,
    currency: 'BRL',
    category: 'preenchedores'
  },
  'botox-allergan': {
    id: 'botox-allergan',
    name: 'Botox Allergan',
    description: 'Toxina botulínica de referência mundial, qualidade Allergan.',
    price: 1600.00,
    currency: 'BRL',
    category: 'toxinas'
  }
};

module.exports = { PRODUCTS };
