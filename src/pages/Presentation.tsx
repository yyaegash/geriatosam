export default function Presentation() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-4 leading-relaxed text-gray-800">
      <h1 className="text-2xl font-bold">Présentation</h1>

      <section>
        <h2 className="font-semibold text-xl mb-2">Pourquoi</h2>
        <p>
          L’évaluation gériatrique réalisée en ville diminuerait la morbi-mortalité des
          patients selon l’étude (cf). À l’heure où le projet de l’OMS ICOPE propose aux
          familles de dépister la fragilité de leurs proches âgés, il nous semble que leurs
          médecins et infirmières de proximité sont tout aussi bien placés. Cet outil
          informatique vise à faciliter l’évaluation et la prise en charge des situations
          rendant les personnes âgées vulnérables.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-xl mb-2">L’outil</h2>
        <p>
          L’onglet <strong>Évaluation gériatrique globale</strong> permet de générer une
          <strong> fiche de fragilité</strong> et un <strong>plan de soin</strong>. Il met à
          disposition une <strong>fiche de fragilité phénotypique</strong> et une
          <strong> fiche d’informations personnelles</strong> à télécharger et remplir.
        </p>

        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Un guide pour ne pas oublier une variable lors d’une évaluation complète</li>
          <li>Une mise au point de la prise en charge pour une fragilité donnée</li>
          <li>Une proposition de plan de soin personnalisé</li>
          <li>Une synthèse permettant d’évaluer l’évolution dans le temps</li>
          <li>
            Une fiche synthétique à partager avec d’autres professionnels, pouvant être
            transmise au DMP avec accord du patient
          </li>
        </ul>

        <p className="mt-2">
          Le dépistage proposé n’est pas exhaustif et peut être réalisé grâce à d’autres
          outils. Il est conçu pour être pratique en médecine de ville : rapide, simple et
          pertinent.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-xl mb-2">Onglet d’aide à la consultation</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Tests cliniques, orientations diagnostiques et arbres décisionnels</li>
          <li>Prise en charge (ressources, orientations, associations)</li>
          <li>Filières gériatriques du territoire</li>
        </ul>
      </section>

      <section>
        <h2 className="font-semibold text-xl mb-2">Qu’est‑ce que la fragilité ?</h2>
        <p>Lois de Bouchon, concept d’épine irritative.</p>
        <p>Définition de la fragilité (phénotypique et multifactorielle).</p>
      </section>

      <section>
        <h2 className="font-semibold text-xl mb-2">Qui dépister ?</h2>
        <p>Personnes fragiles et/ou âgées de plus de 70 ans.</p>
      </section>

      <section>
        <h2 className="font-semibold text-xl mb-2">À qui s’adresse ce site ?</h2>
        <p>Médecins généralistes, IPA, IDEC du DAC et/ou du CRT.</p>
      </section>

      <section>
        <h2 className="font-semibold text-xl mb-2">Rémunération pour les médecins</h2>
        <p>
          Les évaluations sont souvent longues. Certaines cotations permettent une
          rémunération spécifique :
        </p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Dépistage de la dépression ALQP003 : 69,12 €</li>
          <li>Dépistage des troubles neuro‑cognitifs ALQP006 : 69,12 €</li>
          <li>Consultation longue (GL) : 60 €</li>
        </ul>
      </section>
    </div>
  );
}
