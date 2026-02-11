import { externalSupabase } from '@/repositories/externalClient';

export function initializeDebug() {
  // Expor supabase no window para debug no console
  (window as any).debugSupabase = externalSupabase;
  (window as any).checkAuth = async () => {
    try {
      const { data: { session }, error } = await externalSupabase.auth.getSession();
      if (error) {
        console.error('❌ Erro ao obter sessão:', error);
        return { error, session: null };
      }
      
      console.log('✅ Usuário autenticado:', {
        userId: session?.user?.id,
        email: session?.user?.email,
        expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
      });
      
      return { error: null, session };
    } catch (err) {
      console.error('❌ Erro inesperado:', err);
      return { error: err, session: null };
    }
  };

  (window as any).testAlertPersistence = async (userId: string) => {
    console.log('🔍 Testing alert persistence for user:', userId);
    
    // 1. Buscar alertas atuais
    const { data: before, error: beforeError } = await externalSupabase
      .from('alerts')
      .select('*')
      .eq('user_id', userId);
    
    if (beforeError) {
      console.error('❌ Error fetching alerts:', beforeError);
      return;
    }
    
    console.log('📋 Alertas ANTES:', before);
    
    // 2. Criar um alerta de teste
    const testAlert = {
      user_id: userId,
      currency: 'TEST/BRL',
      target_price: 9.99,
      tolerance: 5,
    };
    
    const { data: created, error: createError } = await externalSupabase
      .from('alerts')
      .insert(testAlert)
      .select();
    
    if (createError) {
      console.error('❌ Error creating test alert:', createError);
      return;
    }
    
    console.log('✅ Alerta criado:', created);
    
    // 3. Aguardar 1 segundo
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 4. Verificar se persiste
    const { data: afterCreate, error: afterCreateError } = await externalSupabase
      .from('alerts')
      .select('*')
      .eq('user_id', userId);
    
    console.log('📋 Alertas APÓS CRIAR:', afterCreate);
    
    if (created && created[0]) {
      const alertId = created[0].id;
      
      // 5. Atualizar o alerta
      const { data: updated, error: updateError } = await externalSupabase
        .from('alerts')
        .update({ target_price: 8.88 })
        .eq('id', alertId)
        .select();
      
      if (updateError) {
        console.error('❌ Error updating alert:', updateError);
      } else {
        console.log('✅ Alerta atualizado:', updated);
      }
      
      // 6. Aguardar 1 segundo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 7. Verificar se update persiste
      const { data: afterUpdate } = await externalSupabase
        .from('alerts')
        .select('*')
        .eq('id', alertId);
      
      console.log('📋 Alerta APÓS UPDATE:', afterUpdate);
      
      // 8. Deletar o alerta
      const { data: deleted, error: deleteError } = await externalSupabase
        .from('alerts')
        .delete()
        .eq('id', alertId)
        .select();
      
      if (deleteError) {
        console.error('❌ Error deleting alert:', deleteError);
      } else {
        console.log('✅ Alerta deletado:', deleted);
      }
      
      // 9. Aguardar 1 segundo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 10. Verificar se delete persiste
      const { data: afterDelete } = await externalSupabase
        .from('alerts')
        .select('*')
        .eq('id', alertId);
      
      console.log('📋 Alerta APÓS DELETE (deve estar vazio):', afterDelete);
    }
    
    console.log('✅ Teste completo!');
  };

  (window as any).testRLS = async (alertId: string) => {
    console.log('🔐 Testing RLS for alert:', alertId);
    
    // 1. Get current session
    const { data: { session }, error: sessionError } = await externalSupabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('❌ No session found:', sessionError);
      return;
    }
    
    console.log('✅ Session found:', {
      userId: session.user.id,
      email: session.user.email,
      hasAccessToken: !!session.access_token,
    });
    
    // 2. Check if alert exists and get its user_id
    const { data: alert, error: alertError } = await externalSupabase
      .from('alerts')
      .select('*')
      .eq('id', alertId)
      .single();
    
    if (alertError) {
      console.error('❌ Alert not found:', alertError);
      return;
    }
    
    console.log('📋 Alert found:', {
      id: alert.id,
      user_id: alert.user_id,
      matchesSession: alert.user_id === session.user.id,
    });
    
    // 3. Test if auth.uid() works in RLS by using a custom query
    const { data: rlsTest, error: rlsError } = await externalSupabase.rpc('get_current_user_id');
    
    console.log('🔍 RLS auth.uid() test:', { data: rlsTest, error: rlsError });
    
    // 4. Try to delete with explicit user_id filter
    const { error: deleteError, count } = await externalSupabase
      .from('alerts')
      .delete({ count: 'exact' })
      .eq('id', alertId)
      .eq('user_id', session.user.id);
    
    console.log('🗑️ Delete with explicit user_id filter:', {
      error: deleteError,
      rowsAffected: count,
    });
    
    if (deleteError) {
      console.error('❌ Delete failed:', {
        message: deleteError.message,
        code: deleteError.code,
        details: deleteError.details,
        hint: deleteError.hint,
      });
    } else if (count === 0) {
      console.error('❌ 0 rows deleted - RLS is blocking the operation!');
      console.log('💡 This means auth.uid() in RLS policies is not matching the user_id');
    } else {
      console.log('✅ Delete successful!');
    }
  };

  (window as any).testDelete = async (alertId: string) => {
    console.log('🗑️ Testing delete for alert:', alertId);
    
    // 1. Check if alert exists
    const { data: before, error: beforeError } = await externalSupabase
      .from('alerts')
      .select('*')
      .eq('id', alertId)
      .single();
    
    if (beforeError) {
      console.error('❌ Alert not found:', beforeError);
      return;
    }
    
    console.log('📋 Alert BEFORE delete:', before);
    
    // 2. Delete the alert
    const { data: deleted, error: deleteError } = await externalSupabase
      .from('alerts')
      .delete()
      .eq('id', alertId);
    
    if (deleteError) {
      console.error('❌ Delete failed:', deleteError);
      return;
    }
    
    console.log('✅ Delete response:', deleted);
    
    // 3. Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 4. Check if alert still exists
    const { data: after, error: afterError } = await externalSupabase
      .from('alerts')
      .select('*')
      .eq('id', alertId)
      .single();
    
    if (afterError && afterError.code === 'PGRST116') {
      console.log('✅ Alert successfully deleted - not found in database');
    } else if (after) {
      console.error('❌ Alert STILL EXISTS after delete!', after);
    } else {
      console.error('❌ Unexpected error:', afterError);
    }
  };

  console.log('🔍 Debug inicializado. Use:');
  console.log('   - window.debugSupabase para acessar o cliente');
  console.log('   - await window.checkAuth() para verificar autenticação');
  console.log('   - await window.testRLS("ALERT_ID") para testar RLS');
  console.log('   - await window.testAlertPersistence("USER_ID") para testar persistência');
  console.log('   - await window.testDelete("ALERT_ID") para testar delete específico');
}
