import { SEO } from "@/components/common/SEO";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Privacy = () => {
  return (
    <>
      <SEO 
        title="Privacy Policy - DataKit"
        description="DataKit's privacy policy - Learn how we protect your data and what analytics we collect"
      />
      
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-3xl mx-auto">
          {/* Back button */}
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to DataKit
          </Link>
          
          <h1 className="text-2xl font-bold mb-8">Privacy Policy</h1>
          
          <div className="space-y-6 text-white/80 leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Your Data Stays Local</h2>
              <p>
                DataKit processes all your files locally in your browser. Your data never leaves your device. 
                We don't upload, store, or have access to any of your files or their contents.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">What We Track (With Your Consent)</h2>
              <p className="mb-3">When you consent to analytics, we collect:</p>
              
              <div className="bg-white/5 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-white mb-2">What We Collect:</h3>
                <ul className="space-y-1 text-sm">
                  <li>• Feature usage (which tabs you visit, chart types you create)</li>
                  <li>• Performance metrics (query execution times, file load speeds)</li>
                  <li>• Error reports (JavaScript errors to help us fix bugs)</li>
                  <li>• File metadata (file types and sizes, not content)</li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="font-medium text-white mb-2">What We Never Collect:</h3>
                <ul className="space-y-1 text-sm">
                  <li>• Your uploaded files or their content</li>
                  <li>• SQL queries or code you write</li>
                  <li>• Personal information or identifying data</li>
                  <li>• IP addresses (anonymized by Plausible)</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Analytics Provider</h2>
              <p>
                We use Plausible Analytics, a privacy-focused service based in the EU. 
                Plausible doesn't use cookies, anonymizes IP addresses, and is fully GDPR compliant.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Your Choices</h2>
              <p className="mb-2">
                You can accept or decline analytics at any time. DataKit works fully without analytics enabled.
              </p>
              <p>
                To change your preferences, click the privacy icon in the app or clear your browser data.
              </p>
            </section>


            <div className="text-sm text-white/50 mt-12 pt-8 border-t border-white/10">
              Last updated: {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Privacy;