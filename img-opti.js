const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const DOSSIER_ORIGINAUX = path.join('assets', 'images', 'gallery');
const DOSSIER_SORTIE = path.join('assets', 'images', 'optimisees');

const TAILLES = [480, 800, 1200, 1600]; // max largeur – adapte si besoin

async function optimiserUneImage(fichierEntree, dossierSortie) {
    const nomSansExt = path.basename(fichierEntree, path.extname(fichierEntree));
    const sousDossier = path.basename(path.dirname(fichierEntree)); // ex: concerts, slider...

    // On recrée la structure dans optimisees/
    const dossierCible = path.join(dossierSortie, sousDossier);
    await fs.mkdir(dossierCible, { recursive: true });

    for (const largeur of TAILLES) {
        const nomSortieAvif = path.join(dossierCible, `${nomSansExt}-sharp-opt-${largeur}.avif`);

        await sharp(fichierEntree)
        .resize({ width: largeur, fit: 'inside', withoutEnlargement: true })
        .avif({
        quality: 76, // 76 = bon équilibre qualité/poids pour photos pros
        effort: 6 // 6 = rapide et efficace ; monte à 8 pour + compression (plus lent)
        })
        .toFile(nomSortieAvif);

        console.log(`→ Créé : ${nomSortieAvif}`);
    }
}

async function main() {
    try {
    await fs.mkdir(DOSSIER_SORTIE, { recursive: true });

    // 1. Traiter les sous-dossiers de gallery (concerts, entreprise, etc.)
    const categories = await fs.readdir(DOSSIER_ORIGINAUX);

    for (const cat of categories) {
    const cheminCat = path.join(DOSSIER_ORIGINAUX, cat);
    const stats = await fs.stat(cheminCat);

        if (stats.isDirectory()) {
            const fichiers = await fs.readdir(cheminCat);

            for (const fichier of fichiers) {
                if (/\.(jpe?g|png|avif)$/i.test(fichier)) {
                const cheminComplet = path.join(cheminCat, fichier);
                await optimiserUneImage(cheminComplet, DOSSIER_SORTIE);
                }
            }
        }
    }

    // 2. Traiter les images directement dans assets/images/ (nina, camera, instagram...)
    const dossierImagesRacine = path.join('assets', 'images');
    try {
        const fichiersRacine = await fs.readdir(dossierImagesRacine);

        for (const fichier of fichiersRacine) {
            if (/\.(jpe?g|png|avif)$/i.test(fichier)) {
            const cheminComplet = path.join(dossierImagesRacine, fichier);
            // Pour les fichiers plats, on met dans optimisees/ sans sous-dossier
            await optimiserUneImage(cheminComplet, DOSSIER_SORTIE);
            }
        }
    } catch (err) {
        console.log('Pas de fichiers plats trouvés ou erreur mineure :', err.message);
    }

    console.log('\nFINI ! Toutes les images ont été traitées.');
    console.log(`Regarde dans : ${DOSSIER_SORTIE}`);
    } catch (err) {
        console.error('Erreur globale :', err);
    }
}

main();