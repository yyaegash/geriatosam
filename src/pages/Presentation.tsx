import { motion } from "framer-motion";
import { Stethoscope, Target, Users, HelpCircle, Clock, UserCheck, Euro } from "lucide-react";

const sections = [
  {
    icon: Target,
    title: "Pourquoi",
    content: (
      <p>
        L'évaluation gériatrique réalisée en ville diminuerait la morbi-mortalité des
        patients selon l'étude (cf). À l'heure où le projet de l'OMS ICOPE propose aux
        familles de dépister la fragilité de leurs proches âgés, il nous semble que leurs
        médecins et infirmières de proximité sont tout aussi bien placés. Cet outil
        informatique vise à faciliter l'évaluation et la prise en charge des situations
        rendant les personnes âgées vulnérables.
      </p>
    )
  },
  {
    icon: Stethoscope,
    title: "L'outil",
    content: (
      <div className="space-y-4">
        <p>
          L'onglet <strong>Évaluation gériatrique globale</strong> permet de générer une
          <strong> fiche de fragilité</strong> et un <strong>plan de soin</strong>. Il met à
          disposition une <strong>fiche de fragilité phénotypique</strong> et une
          <strong> fiche d'informations personnelles</strong> à télécharger et remplir.
        </p>

        <div className="grid gap-3">
          {[
            "Un guide pour ne pas oublier une variable lors d'une évaluation complète",
            "Une mise au point de la prise en charge pour une fragilité donnée",
            "Une proposition de plan de soin personnalisé",
            "Une synthèse permettant d'évaluer l'évolution dans le temps",
            "Une fiche synthétique à partager avec d'autres professionnels, pouvant être transmise au DMP avec accord du patient"
          ].map((item, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0"></div>
              <span className="text-sm text-slate-700">{item}</span>
            </div>
          ))}
        </div>

        <p className="text-slate-600 bg-slate-50 p-4 rounded-xl border-l-4 border-blue-500">
          Le dépistage proposé n'est pas exhaustif et peut être réalisé grâce à d'autres
          outils. Il est conçu pour être pratique en médecine de ville : rapide, simple et
          pertinent.
        </p>
      </div>
    )
  },
  {
    icon: HelpCircle,
    title: "Onglet d'aide à la consultation",
    content: (
      <div className="grid gap-3">
        {[
          "Tests cliniques, orientations diagnostiques et arbres décisionnels",
          "Prise en charge (ressources, orientations, associations)",
          "Filières gériatriques du territoire"
        ].map((item, index) => (
          <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-green-50 border border-green-100">
            <div className="w-2 h-2 rounded-full bg-green-500 mt-2 shrink-0"></div>
            <span className="text-sm text-slate-700">{item}</span>
          </div>
        ))}
      </div>
    )
  },
  {
    icon: Clock,
    title: "Qu'est‑ce que la fragilité ?",
    content: (
      <div className="space-y-2">
        <p>Lois de Bouchon, concept d'épine irritative.</p>
        <p>Définition de la fragilité (phénotypique et multifactorielle).</p>
      </div>
    )
  },
  {
    icon: UserCheck,
    title: "Qui dépister ?",
    content: <p>Personnes fragiles et/ou âgées de plus de 70 ans.</p>
  },
  {
    icon: Users,
    title: "À qui s'adresse ce site ?",
    content: <p>Médecins généralistes, IPA, IDEC du DAC et/ou du CRT.</p>
  },
  {
    icon: Euro,
    title: "Rémunération pour les médecins",
    content: (
      <div className="space-y-4">
        <p>
          Les évaluations sont souvent longues. Certaines cotations permettent une
          rémunération spécifique :
        </p>
        <div className="grid gap-2">
          {[
            { code: "ALQP003", desc: "Dépistage de la dépression", price: "69,12 €" },
            { code: "ALQP006", desc: "Dépistage des troubles neuro‑cognitifs", price: "69,12 €" },
            { code: "GL", desc: "Consultation longue", price: "60 €" }
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200">
              <div>
                <span className="font-mono text-sm text-amber-800 bg-amber-200 px-2 py-1 rounded">
                  {item.code}
                </span>
                <span className="ml-2 text-slate-700">{item.desc}</span>
              </div>
              <span className="font-semibold text-amber-800">{item.price}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
];

export default function Presentation() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* En-tête principal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="medical-header rounded-2xl mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold text-slate-900">Présentation</h1>
              <p className="text-slate-600">Système d'évaluation gériatrique professionnel</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Sections avec design médical */}
      <div className="space-y-8">
        {sections.map((section, index) => {
          const Icon = section.icon;
          return (
            <motion.section
              key={section.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="medical-container p-6 lg:p-8 smooth-transition hover:shadow-lg"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl lg:text-2xl font-bold text-slate-800 mb-4">
                    {section.title}
                  </h2>
                  <div className="text-slate-700 leading-relaxed">
                    {section.content}
                  </div>
                </div>
              </div>
            </motion.section>
          );
        })}
      </div>

      {/* Footer d'information */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 text-center"
      >
        <div className="glass-effect p-6 rounded-2xl">
          <p className="text-slate-600 text-sm">
            Cet outil est conçu pour optimiser la prise en charge gériatrique en médecine de ville
          </p>
        </div>
      </motion.div>
    </div>
  );
}