// Função determinística de Hash para geração de dados cadastrais consistentes
const getSeed = (str) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

const randomFromSeed = (seed) => {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export const getMockStudentDetails = (aluno) => {
  const seed = getSeed(aluno.nome)
  
  // R.A. (Registro do Aluno)
  const ra = String(100000000 + (seed % 900000000))
  
  // CPF e RG mockados
  const rg = `${String(10 + (seed % 89)).padStart(2, '0')}.${String(100 + (seed % 900)).padStart(3, '0')}.${String(100 + (seed % 899)).padStart(3, '0')}-${seed % 10}`
  const cpf = `${String(100 + (seed % 900)).padStart(3, '0')}.${String(100 + ((seed + 2) % 900)).padStart(3, '0')}.${String(100 + ((seed + 4) % 900)).padStart(3, '0')}-${String(seed % 99).padStart(2, '0')}`

  // Idade e nascimento baseados na série
  let age = 11
  const tNome = aluno.turma.toLowerCase()
  if (tNome.startsWith('7')) age = 12
  else if (tNome.startsWith('8')) age = 13
  else if (tNome.startsWith('9')) age = 14
  else if (tNome.startsWith('1')) age = 15
  else if (tNome.startsWith('2')) age = 16
  else if (tNome.startsWith('3')) age = 17
  
  const birthYear = new Date().getFullYear() - age
  const birthMonth = 1 + (seed % 12)
  const birthDay = 1 + (seed % 28)
  const birthDateStr = `${String(birthDay).padStart(2, '0')}/${String(birthMonth).padStart(2, '0')}/${birthYear}`
  
  // Nomes de responsáveis mockados
  const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes']
  const parentFirstNames = ['Maria', 'Ana', 'Carlos', 'José', 'João', 'Marcos', 'Sandra', 'Regina', 'Sônia', 'Antônio']
  const parentName = `${parentFirstNames[seed % parentFirstNames.length]} ${lastNames[(seed + 3) % lastNames.length]} ${aluno.nome.split(' ').pop()}`
  
  const phone = `(11) 9${10000000 + (seed % 90000000)}`
  const email = `${aluno.nome.toLowerCase().split(' ').join('.')}@escola.sp.gov.br`
  
  // Endereço mockado
  const streetNames = ['Av. Paulista', 'Rua das Flores', 'Alameda Santos', 'Rua Augusta', 'Av. Consolação', 'Rua Bahia', 'Av. Tiradentes']
  const address = `${streetNames[seed % streetNames.length]}, ${10 + (seed % 990)} - Jardim América, São Paulo - SP`

  const genders = ['Masculino', 'Feminino']
  const gender = genders[seed % genders.length]
  
  // Boletim Escolar mockado
  const subjects = [
    'Língua Portuguesa',
    'Matemática',
    'Ciências da Natureza',
    'História',
    'Geografia',
    'Arte',
    'Educação Física',
    'Língua Inglesa'
  ]
  
  let currentSeed = seed
  const boletim = subjects.map(subject => {
    const b1 = parseFloat((5.5 + randomFromSeed(currentSeed++) * 4.5).toFixed(1))
    const b2 = parseFloat((5.5 + randomFromSeed(currentSeed++) * 4.5).toFixed(1))
    const b3 = parseFloat((5.5 + randomFromSeed(currentSeed++) * 4.5).toFixed(1))
    const b4 = parseFloat((5.5 + randomFromSeed(currentSeed++) * 4.5).toFixed(1))
    const media = parseFloat(((b1 + b2 + b3 + b4) / 4).toFixed(1))
    const status = media >= 6.0 ? 'Aprovado' : 'Em Recuperação'
    return { subject, b1, b2, b3, b4, media, status }
  })

  return {
    ra,
    rg,
    cpf,
    birthDate: birthDateStr,
    parentName,
    phone,
    email,
    address,
    gender,
    boletim
  }
}
