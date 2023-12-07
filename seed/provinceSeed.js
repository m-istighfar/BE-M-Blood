const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const provinces = [
    { ProvinceID: "11", Name: "ACEH", Capital: "Banda Aceh" },
    { ProvinceID: "12", Name: "SUMATERA UTARA", Capital: "Medan" },
    { ProvinceID: "13", Name: "SUMATERA BARAT", Capital: "Padang" },
    { ProvinceID: "14", Name: "RIAU", Capital: "Pekanbaru" },
    { ProvinceID: "15", Name: "JAMBI", Capital: "Jambi" },
    { ProvinceID: "16", Name: "SUMATERA SELATAN", Capital: "Palembang" },
    { ProvinceID: "17", Name: "BENGKULU", Capital: "Bengkulu" },
    { ProvinceID: "18", Name: "LAMPUNG", Capital: "Bandar Lampung" },
    {
      ProvinceID: "19",
      Name: "KEPULAUAN BANGKA BELITUNG",
      Capital: "Pangkal Pinang",
    },
    { ProvinceID: "21", Name: "KEPULAUAN RIAU", Capital: "Tanjung Pinang" },
    { ProvinceID: "31", Name: "DKI JAKARTA", Capital: "Jakarta" },
    { ProvinceID: "32", Name: "JAWA BARAT", Capital: "Bandung" },
    { ProvinceID: "33", Name: "JAWA TENGAH", Capital: "Semarang" },
    { ProvinceID: "34", Name: "DI YOGYAKARTA", Capital: "Yogyakarta" },
    { ProvinceID: "35", Name: "JAWA TIMUR", Capital: "Surabaya" },
    { ProvinceID: "36", Name: "BANTEN", Capital: "Serang" },
    { ProvinceID: "51", Name: "BALI", Capital: "Denpasar" },
    { ProvinceID: "52", Name: "NUSA TENGGARA BARAT", Capital: "Mataram" },
    { ProvinceID: "53", Name: "NUSA TENGGARA TIMUR", Capital: "Kupang" },
    { ProvinceID: "61", Name: "KALIMANTAN BARAT", Capital: "Pontianak" },
    { ProvinceID: "62", Name: "KALIMANTAN TENGAH", Capital: "Palangkaraya" },
    { ProvinceID: "63", Name: "KALIMANTAN SELATAN", Capital: "Banjarmasin" },
    { ProvinceID: "64", Name: "KALIMANTAN TIMUR", Capital: "Samarinda" },
    { ProvinceID: "65", Name: "KALIMANTAN UTARA", Capital: "Tanjung Selor" },
    { ProvinceID: "71", Name: "SULAWESI UTARA", Capital: "Manado" },
    { ProvinceID: "72", Name: "SULAWESI TENGAH", Capital: "Palu" },
    { ProvinceID: "73", Name: "SULAWESI SELATAN", Capital: "Makassar" },
    { ProvinceID: "74", Name: "SULAWESI TENGGARA", Capital: "Kendari" },
    { ProvinceID: "75", Name: "GORONTALO", Capital: "Gorontalo" },
    { ProvinceID: "76", Name: "SULAWESI BARAT", Capital: "Mamuju" },
    { ProvinceID: "81", Name: "MALUKU", Capital: "Ambon" },
    { ProvinceID: "82", Name: "MALUKU UTARA", Capital: "Sofifi" },
    { ProvinceID: "91", Name: "PAPUA BARAT", Capital: "Manokwari" },
    { ProvinceID: "94", Name: "PAPUA", Capital: "Jayapura" },
  ];
  for (const province of provinces) {
    await prisma.province.create({
      data: {
        ProvinceID: parseInt(province.ProvinceID),
        Name: province.Name,
        Capital: province.Capital,
      },
    });
  }
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
